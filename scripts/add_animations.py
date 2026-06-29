#!/usr/bin/env python3
"""Inject slide transitions and entrance animations into unpacked PPTX XML."""

import re
import sys
import zipfile
from pathlib import Path
from lxml import etree

NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"
A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"

EFFECT_MS = 800
STAGGER_MS = 400

# Per-slide animation sequences: list of (object_name_or_list, effect_type, extra_delay_ms)
# effect_type: fade | fly_left | zoom | float
SLIDE_SEQUENCES = [
    # Slide 1 — Hook
    [
        ("s1-title", "fade", 0),
        ("s1-subtitle", "fade", 500),
        ("s1-search", "zoom", 1000),
        (["s1-card-0", "s1-card-1", "s1-card-2", "s1-card-3"], "fade", 1600),
    ],
    # Slide 2 — Comportement
    [
        ("s2-title", "fade", 0),
        ("s2-subtitle", "fade", 400),
        (
            ["s2-step-0", "s2-step-0-icon-bg", "s2-step-0-icon", "s2-step-0-num", "s2-step-0-text"],
            "fly_left",
            900,
        ),
        ("s2-arrow-0", "fade", 1300),
        (
            ["s2-step-1", "s2-step-1-icon-bg", "s2-step-1-icon", "s2-step-1-num", "s2-step-1-text"],
            "fly_left",
            1500,
        ),
        ("s2-arrow-1", "fade", 1900),
        (
            ["s2-step-2", "s2-step-2-icon-bg", "s2-step-2-icon", "s2-step-2-num", "s2-step-2-text"],
            "fly_left",
            2100,
        ),
    ],
    # Slide 3 — Problème
    [
        ("s3-title", "fade", 0),
        ("s3-subtitle", "fade", 400),
        ("s3-phone", "fade", 800),
        (["s3-doubt-card", "s3-doubt-text"], "fade", 1400),
        ("s3-thought-0", "float", 1800),
        ("s3-thought-1", "float", 2100),
        ("s3-thought-2", "float", 2400),
        ("s3-thought-3", "float", 2700),
    ],
    # Slide 4 — Rôle site
    [
        ("s4-title", "fade", 0),
        ("s4-subtitle", "fade", 400),
        (["s4-card-0", "s4-icon-0", "s4-text-0"], "zoom", 900),
        (["s4-card-1", "s4-icon-1", "s4-text-1"], "zoom", 1200),
        (["s4-card-2", "s4-icon-2", "s4-text-2"], "zoom", 1500),
        (["s4-card-3", "s4-icon-3", "s4-text-3"], "zoom", 1800),
    ],
    # Slide 5 — Vision
    [
        ("s5-title", "fade", 0),
        ("s5-subtitle", "fade", 400),
        ("s5-wireframe", "fade", 900),
        ("s5-final", "fade", 2200),
        ("s5-phone", "zoom", 2800),
        (["s5-label-bg-0", "s5-label-0"], "fade", 3200),
        (["s5-label-bg-1", "s5-label-1"], "fade", 3500),
        (["s5-label-bg-2", "s5-label-2"], "fade", 3800),
        (["s5-label-bg-3", "s5-label-3"], "fade", 4100),
    ],
    # Slide 6 — Avant/Après
    [
        ("s6-title", "fade", 0),
        (["s6-avant-label", "s6-avant-text", "s6-avant-visual"], "fade", 500),
        ("s6-divider", "fade", 2000),
        (["s6-apres-label", "s6-apres-text", "s6-apres-visual"], "fade", 2400),
    ],
    # Slide 7 — Offre
    [
        ("s7-title", "fade", 0),
        ("s7-subtitle", "fade", 400),
    ]
    + [
        (
            [f"s7-card-{i}", f"s7-card-{i}-icon", f"s7-card-{i}-text"],
            "float",
            900 + i * 350,
        )
        for i in range(6)
    ],
    # Slide 8 — Approche
    [
        ("s8-title", "fade", 0),
        ("s8-subtitle", "fade", 400),
        ("s8-mockup", "fade", 900),
    ]
    + [
        ([f"s8-step-{i}", f"s8-step-num-{i}", f"s8-step-text-{i}"], "fly_left", 1500 + i * 500)
        for i in range(3)
    ],
    # Slide 9 — Closing
    [
        ("s9-title", "fade", 0),
        ("s9-subtitle", "fade", 600),
        ("s9-cta", "fade", 1100),
        ("s9-glow", "fade", 1600),
        ("s9-phone", "zoom", 1800),
        ("s9-logo", "fade", 2600),
    ],
]


def qn(tag: str) -> str:
    prefix, local = tag.split(":")
    return f"{{{NS[prefix]}}}{local}"


class AnimBuilder:
    def __init__(self):
        self._id = 100

    def next_id(self) -> int:
        self._id += 1
        return self._id

    def _visibility_set(self, eid: int, spid: int) -> str:
        ctn = self.next_id()
        return f"""<p:set>
  <p:cBhvr>
    <p:cTn id="{ctn}" dur="1" fill="hold"/>
    <p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>
    <p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>
  </p:cBhvr>
  <p:to><p:strVal val="visible"/></p:to>
</p:set>"""

    def _fade_effect(self, eid: int, spid: int) -> str:
        ctn = self.next_id()
        return f"""<p:animEffect transition="in" filter="fade">
  <p:cBhvr>
    <p:cTn id="{ctn}" dur="{EFFECT_MS}" fill="hold"/>
    <p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>
  </p:cBhvr>
</p:animEffect>"""

    def _fly_left(self, eid: int, spid: int) -> str:
        ctn = self.next_id()
        return f"""<p:anim calcmode="lin" valueType="num">
  <p:cBhvr additive="base">
    <p:cTn id="{ctn}" dur="{EFFECT_MS}" fill="hold"/>
    <p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>
    <p:attrNameLst><p:attrName>ppt_x</p:attrName></p:attrNameLst>
  </p:cBhvr>
  <p:tavLst>
    <p:tav tm="0"><p:val><p:strVal val="#ppt_x-.5"/></p:val></p:tav>
    <p:tav tm="100000"><p:val><p:strVal val="#ppt_x"/></p:val></p:tav>
  </p:tavLst>
</p:anim>
{self._fade_effect(eid, spid)}"""

    def _zoom_in(self, eid: int, spid: int) -> str:
        ctn = self.next_id()
        ctn2 = self.next_id()
        return f"""<p:animScale>
  <p:cBhvr>
    <p:cTn id="{ctn}" dur="{EFFECT_MS}" fill="hold"/>
    <p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>
  </p:cBhvr>
  <p:to><p:strVal val="110%"/></p:to>
</p:animScale>
{self._fade_effect(eid, spid)}"""

    def _float_in(self, eid: int, spid: int) -> str:
        ctn = self.next_id()
        return f"""<p:anim calcmode="lin" valueType="num">
  <p:cBhvr additive="base">
    <p:cTn id="{ctn}" dur="{EFFECT_MS}" fill="hold"/>
    <p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl>
    <p:attrNameLst><p:attrName>ppt_y</p:attrName></p:attrNameLst>
  </p:cBhvr>
  <p:tavLst>
    <p:tav tm="0"><p:val><p:strVal val="#ppt_y+.08"/></p:val></p:tav>
    <p:tav tm="100000"><p:val><p:strVal val="#ppt_y"/></p:val></p:tav>
  </p:tavLst>
</p:anim>
{self._fade_effect(eid, spid)}"""

    def effect_par(
        self,
        spids: list[int],
        delay: int,
        effect: str,
        node_type: str,
        grp: int,
    ) -> str:
        eid = self.next_id()
        children = []
        for spid in spids:
            children.append(self._visibility_set(eid, spid))
            if effect == "fade":
                children.append(self._fade_effect(eid, spid))
            elif effect == "fly_left":
                children.append(self._fly_left(eid, spid))
            elif effect == "zoom":
                children.append(self._zoom_in(eid, spid))
            elif effect == "float":
                children.append(self._float_in(eid, spid))

        child_xml = "\n".join(children)
        preset = ""
        if effect == "fade":
            preset = ' presetID="10" presetClass="entr" presetSubtype="0"'
        elif effect == "fly_left":
            preset = ' presetID="2" presetClass="entr" presetSubtype="1"'
        elif effect == "zoom":
            preset = ' presetID="53" presetClass="entr" presetSubtype="0"'
        elif effect == "float":
            preset = ' presetID="42" presetClass="entr" presetSubtype="8"'

        return f"""<p:par>
  <p:cTn id="{eid}"{preset} fill="hold" grpId="{grp}" nodeType="{node_type}">
    <p:stCondLst><p:cond delay="{delay}"/></p:stCondLst>
    <p:childTnLst>
      {child_xml}
    </p:childTnLst>
  </p:cTn>
</p:par>"""

    def build_timing(self, effects: list[str]) -> etree._Element:
        xml = f"""<p:timing xmlns:p="{P_NS}" xmlns:a="{A_NS}">
  <p:tnLst>
    <p:par>
      <p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot">
        <p:childTnLst>
          <p:seq concurrent="1" nextAc="seek">
            <p:cTn id="2" dur="indefinite" nodeType="mainSeq">
              <p:childTnLst>
                {''.join(effects)}
              </p:childTnLst>
            </p:cTn>
            <p:prevCondLst><p:cond evt="onPrev" delay="0"/></p:prevCondLst>
            <p:nextCondLst><p:cond evt="onNext" delay="0"/></p:nextCondLst>
          </p:seq>
        </p:childTnLst>
      </p:cTn>
    </p:par>
  </p:tnLst>
</p:timing>"""
        return etree.fromstring(xml.encode("utf-8"))


def get_shape_map(slide_path: Path) -> dict[str, int]:
    tree = etree.parse(str(slide_path))
    root = tree.getroot()
    mapping = {}
    for elem in root.iter(qn("p:cNvPr")):
        name = elem.get("name", "")
        spid = elem.getparent().getparent().find(qn("p:nvSpPr"))
        if spid is None:
            # might be pic
            parent = elem.getparent().getparent()
        sid = elem.get("id")
        if name and sid:
            mapping[name] = int(sid)
    # also check pic elements
    for pic in root.iter(qn("p:pic")):
        nv = pic.find(qn("p:nvPicPr"))
        if nv is not None:
            cnv = nv.find(qn("p:cNvPr"))
            if cnv is not None:
                name = cnv.get("name", "")
                sid = cnv.get("id")
                if name and sid:
                    mapping[name] = int(sid)
    return mapping


def add_transition(slide_path: Path) -> None:
    tree = etree.parse(str(slide_path))
    root = tree.getroot()
    # Remove existing transition
    for tr in root.findall(qn("p:transition")):
        root.remove(tr)
    transition = etree.Element(qn("p:transition"))
    transition.set("spd", "med")
    fade = etree.SubElement(transition, qn("p:fade"))
    # Insert after cSld
    csld = root.find(qn("p:cSld"))
    if csld is not None:
        idx = list(root).index(csld) + 1
        root.insert(idx, transition)
    tree.write(str(slide_path), xml_declaration=True, encoding="UTF-8", standalone=True)


def add_animations_to_slide(slide_path: Path, sequence: list, slide_idx: int) -> None:
    shape_map = get_shape_map(slide_path)
    builder = AnimBuilder()
    effects = []
    grp = 0

    for entry in sequence:
        names, effect, delay = entry
        if isinstance(names, str):
            names = [names]
        spids = []
        for name in names:
            if name in shape_map:
                spids.append(shape_map[name])
            else:
                print(f"  Warning: shape '{name}' not found on slide {slide_idx + 1}")
        if not spids:
            continue
        node_type = "clickEffect" if delay == 0 and not effects else "withEffect"
        if delay == 0 and effects:
            node_type = "withEffect"
        grp += 1
        effects.append(builder.effect_par(spids, delay, effect, node_type, grp))

    if not effects:
        return

    tree = etree.parse(str(slide_path))
    root = tree.getroot()

    # Remove existing timing
    for timing in root.findall(qn("p:timing")):
        root.remove(timing)

    timing_elem = builder.build_timing(effects)
    root.append(timing_elem)
    tree.write(str(slide_path), xml_declaration=True, encoding="UTF-8", standalone=True)


def process_unpacked(unpacked_dir: Path) -> None:
    slides_dir = unpacked_dir / "ppt" / "slides"
    slide_files = sorted(
        slides_dir.glob("slide*.xml"),
        key=lambda p: int(re.search(r"slide(\d+)", p.name).group(1)),
    )
    for i, slide_path in enumerate(slide_files):
        print(f"Processing slide {i + 1}: {slide_path.name}")
        add_transition(slide_path)
        if i < len(SLIDE_SEQUENCES):
            add_animations_to_slide(slide_path, SLIDE_SEQUENCES[i], i)


def pack_unpacked(unpacked_dir: Path, output_path: Path) -> None:
    """Repack unpacked directory into a pptx zip."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in sorted(unpacked_dir.rglob("*")):
            if file_path.is_file():
                arcname = file_path.relative_to(unpacked_dir)
                zf.write(file_path, arcname)
    print(f"Packed: {output_path}")


def main():
    base = Path("/Users/furkan/Documents/pitchclientzs")
    unpacked = base / "unpacked"
    output = base / "zerosix-pitch-sans-site.pptx"

    if not unpacked.exists():
        print("Unpacked directory not found. Run unpack first.")
        sys.exit(1)

    process_unpacked(unpacked)

    # Use skill pack script if available for validation
    pack_script = Path("/Users/furkan/.grok/skills/pptx/scripts/office/pack.py")
    if pack_script.exists():
        import subprocess
        subprocess.run(
            [
                "python3",
                str(pack_script),
                str(unpacked),
                str(output),
                "--original",
                str(output),
            ],
            check=True,
        )
    else:
        pack_unpacked(unpacked, output)


if __name__ == "__main__":
    main()
/**
 * P0021 directory fixed-column SSOT — Voice rail + Keyframe scene table.
 * Generate CSS: node scripts/generate-p0021-directory-fixed-col-css.mjs
 */
export const P0021_DIRECTORY_FIXED_COLUMNS = [
  {
    colClass: "studio-voice-col--gender",
    width: "3.25rem",
    kind: "compact",
    align: "center",
    keys: ["gender"],
  },
  {
    colClass: "studio-voice-col--name",
    width: "7rem",
    kind: "code",
    keys: ["name"],
  },
  {
    colClass: "studio-voice-col--locale",
    width: "4.25rem",
    kind: "compact",
    align: "center",
    keys: ["locale"],
  },
  {
    colClass: "studio-keyframe-col--scene",
    width: "5rem",
    kind: "code",
    keys: ["scene"],
  },
  {
    colClass: "studio-keyframe-col--image",
    width: "9rem",
    kind: "compact",
    keys: ["image"],
  },
  {
    colClass: "studio-keyframe-col--start",
    width: "6.5rem",
    kind: "date",
    align: "center",
    keys: ["start"],
  },
  {
    colClass: "studio-keyframe-col--duration",
    width: "6rem",
    kind: "compact",
    align: "center",
    keys: ["duration"],
  },
  {
    colClass: "studio-keyframe-col--transition",
    width: "10rem",
    kind: "compact",
    keys: ["transition"],
  },
  {
    colClass: "studio-keyframe-col--effect",
    width: "9rem",
    kind: "compact",
    keys: ["effect"],
  },
  {
    colClass: "studio-keyframe-col--transcript",
    width: "18rem",
    kind: "compact",
    keys: ["transcript"],
  },
];

export const P0021_DIRECTORY_FIXED_TABLE_ROOTS = [
  ".studio-voice-directory-frame table.studio-voice-rail-table",
  ".studio-keyframe-scene-directory-frame table.studio-keyframe-scene-table",
];

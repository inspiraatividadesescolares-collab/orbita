"""Generate the skin-tone and hair-color layers used by the avatar builder.

The original artwork remains untouched. The generated PNG files keep the
original transparency, outlines, highlights and shadows so every layer still
aligns with the 500 x 700 avatar canvas.
"""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
AVATAR_DIR = ROOT / "assets" / "imagens" / "avatar"
BASE_SOURCE = AVATAR_DIR / "avatar-base.png"
HAIR_SOURCE_DIR = AVATAR_DIR / "avatar-cabelos"
EARRING_SOURCE = AVATAR_DIR / "avatar-acessorios" / "brincos-vermelhos.png"
BASE_OUTPUT_DIR = AVATAR_DIR / "avatar-bases"
HAIR_OUTPUT_DIR = AVATAR_DIR / "avatar-cabelos-cores"
EARRING_OUTPUT_DIR = AVATAR_DIR / "avatar-acessorios" / "brincos-cores"
PREVIEW_OUTPUT_DIR = AVATAR_DIR / "avatar-previews"

SKIN_TONES = [
    ("01-porcelana", "#FFD8C2"),
    ("02-pessego", "#F3C09B"),
    ("03-dourada", "#DEA578"),
    ("04-caramelo", "#C7875E"),
    ("05-canela", "#A96848"),
    ("06-cacau", "#85503A"),
    ("07-ebano", "#61392C"),
    ("08-noite", "#3E261F"),
]

HAIR_COLORS = [
    ("loiro", "#D6A33A"),
    ("ruivo", "#B9562D"),
    ("castanho", "#70402A"),
    ("preto", "#262020"),
]

EARRING_COLORS = [
    ("vermelho", "#C62F35"),
    ("rosa", "#EF6AA8"),
    ("roxo", "#8A4DB5"),
    ("branco", "#F5F2F7"),
]

SOURCE_SKIN_REFERENCE = (254, 188, 140)
SOURCE_HAIR_LUMINANCE = 72
SOURCE_EARRING_LUMINANCE = 66


def hex_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[index : index + 2], 16) for index in (0, 2, 4))


def skin_region(x, y):
    """Return True for the exposed body and False for the undergarment."""
    return (
        y < 305
        or (278 <= y < 340 and 215 <= x <= 285)
        or (290 <= y < 455 and (x < 226 or x > 274))
        or y >= 430
    )


def generate_skin_tones():
    source = Image.open(BASE_SOURCE).convert("RGBA")
    BASE_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for slug, color in SKIN_TONES:
        target = hex_rgb(color)
        result = source.copy()
        pixels = result.load()

        for y in range(result.height):
            for x in range(result.width):
                red, green, blue, alpha = pixels[x, y]
                if not alpha or not skin_region(x, y):
                    continue

                pixels[x, y] = (
                    min(255, round(red * target[0] / SOURCE_SKIN_REFERENCE[0])),
                    min(255, round(green * target[1] / SOURCE_SKIN_REFERENCE[1])),
                    min(255, round(blue * target[2] / SOURCE_SKIN_REFERENCE[2])),
                    alpha,
                )

        result.save(BASE_OUTPUT_DIR / f"{slug}.png", optimize=True)


def generate_hair_colors():
    HAIR_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for source_path in sorted(HAIR_SOURCE_DIR.glob("*.png")):
        source = Image.open(source_path).convert("RGBA")

        for color_slug, color in HAIR_COLORS:
            target = hex_rgb(color)
            result = source.copy()
            pixels = result.load()

            for y in range(result.height):
                for x in range(result.width):
                    red, green, blue, alpha = pixels[x, y]
                    if not alpha:
                        continue

                    luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
                    if luminance < 24:
                        continue

                    shade = max(0.28, min(2.0, luminance / SOURCE_HAIR_LUMINANCE))
                    pixels[x, y] = (
                        min(255, round(target[0] * shade)),
                        min(255, round(target[1] * shade)),
                        min(255, round(target[2] * shade)),
                        alpha,
                    )

            result.save(
                HAIR_OUTPUT_DIR / f"{source_path.stem}-{color_slug}.png",
                optimize=True,
            )


def generate_earring_colors():
    source = Image.open(EARRING_SOURCE).convert("RGBA")
    EARRING_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for color_slug, color in EARRING_COLORS:
        target = hex_rgb(color)
        result = source.copy()
        pixels = result.load()

        for y in range(result.height):
            for x in range(result.width):
                red, green, blue, alpha = pixels[x, y]
                if not alpha:
                    continue

                luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
                if luminance < 20:
                    continue

                shade = max(0.25, min(1.75, luminance / SOURCE_EARRING_LUMINANCE))
                pixels[x, y] = (
                    min(255, round(target[0] * shade)),
                    min(255, round(target[1] * shade)),
                    min(255, round(target[2] * shade)),
                    alpha,
                )

        result.save(EARRING_OUTPUT_DIR / f"brincos-{color_slug}.png", optimize=True)


def save_centered_preview(source_path,output_path):
    source = Image.open(source_path).convert("RGBA")
    bounds = source.getchannel("A").getbbox()
    if not bounds:
        preview = Image.new("RGBA", (64, 64))
    else:
        cropped = source.crop(bounds)
        padding = max(12, round(max(cropped.size) * 0.12))
        side = max(cropped.size) + padding * 2
        preview = Image.new("RGBA", (side, side))
        preview.alpha_composite(
            cropped,
            ((side - cropped.width) // 2, (side - cropped.height) // 2),
        )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    preview.save(output_path, optimize=True)


def generate_centered_previews():
    preview_groups = [
        (AVATAR_DIR / "avatar-rostos", PREVIEW_OUTPUT_DIR / "rostos"),
        (HAIR_OUTPUT_DIR, PREVIEW_OUTPUT_DIR / "cabelos"),
        (AVATAR_DIR / "avatar-roupas", PREVIEW_OUTPUT_DIR / "roupas"),
        (AVATAR_DIR / "avatar-sapatos", PREVIEW_OUTPUT_DIR / "sapatos"),
        (AVATAR_DIR / "avatar-acessorios", PREVIEW_OUTPUT_DIR / "acessorios"),
        (EARRING_OUTPUT_DIR, PREVIEW_OUTPUT_DIR / "acessorios"),
    ]
    generated = 0
    for source_dir, output_dir in preview_groups:
        for source_path in sorted(source_dir.glob("*.png")):
            save_centered_preview(source_path, output_dir / source_path.name)
            generated += 1
    return generated


if __name__ == "__main__":
    generate_skin_tones()
    generate_hair_colors()
    generate_earring_colors()
    preview_count = generate_centered_previews()
    print(
        f"Generated {len(SKIN_TONES)} skin bases and "
        f"{len(list(HAIR_SOURCE_DIR.glob('*.png'))) * len(HAIR_COLORS)} hair layers "
        f"and {len(EARRING_COLORS)} earring layers, plus "
        f"{preview_count} centered previews."
    )

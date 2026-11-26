"""Rebuild the small, transparent achievement loops from their original PNGs (Pillow)."""

from math import cos, exp, pi
from pathlib import Path

from PIL import Image, ImageDraw


ART = Path(__file__).resolve().parents[1] / "public" / "unicorns"
FRAME_MS = 65

# Each pin moves a small part of the original drawing. Coordinates, radius and
# travel are in source pixels. Opposing pins leave the surrounding props still.
PINS = {
    "first-steps": [(120, 223, 31, -8, -13), (184, 209, 28, 7, 6), (153, 127, 62, 2, -4)],
    "warrior": [(159, 9, 32, -9, 10), (96, 38, 21, 7, 9), (52, 81, 19, 5, -10),
                (256, 105, 21, -4, -11), (12, 180, 18, 5, -8), (248, 151, 23, 5, 8)],
    "dedicated": [(49, 111, 35, 12, -7), (88, 169, 23, 5, 1), (105, 187, 16, 5, 1)],
    "down-5kg": [(215, 116, 30, -11, -9), (231, 159, 26, 1, -5), (195, 165, 22, 1, -3)],
    "trailblazer": [(301, 87, 32, -4, 11), (267, 94, 19, 0, -4)],
    "comeback": [(73, 131, 15, -5, -8), (84, 142, 12, -2, -3)],
}


def bend(art, pins, amount):
    def source_point(x, y):
        sx, sy = x, y
        for cx, cy, radius, dx, dy in pins:
            weight = exp(-((x - cx) ** 2 + (y - cy) ** 2) / radius ** 2) * amount
            sx -= dx * weight
            sy -= dy * weight
        return sx, sy

    mesh = []
    for y in range(0, art.height, 10):
        for x in range(0, art.width, 10):
            right, bottom = min(art.width, x + 10), min(art.height, y + 10)
            corners = (source_point(x, y), source_point(x, bottom),
                       source_point(right, bottom), source_point(right, y))
            mesh.append(((x, y, right, bottom), sum(corners, ())))
    warped = art.transform(art.size, Image.Transform.MESH, mesh, Image.Resampling.BICUBIC)
    moving = Image.new("L", art.size)
    pen = ImageDraw.Draw(moving)
    for cx, cy, radius, _, _ in pins:
        edge = radius * 1.8
        pen.ellipse((cx - edge, cy - edge, cx + edge, cy + edge), fill=255)
    return Image.composite(warped, art, moving)


def glint(art, bounds, t):
    # Sweep light across the gold paint only, preserving the outline and handles.
    left, top, right, bottom = bounds
    frame = art.copy()
    center = left - 24 + (right - left + 54) * t
    for y in range(top, bottom):
        for x in range(left, right):
            r, g, b, a = art.getpixel((x, y))
            if r > 175 and g > 105 and r - b > 45 and a > 210:
                distance = x + (y - top) * 0.27 - center
                light = 0.88 * exp(-(distance / 9) ** 2)
                frame.putpixel((x, y), tuple(round(c + (255 - c) * light) for c in (r, g, b)) + (a,))
    return frame


def arrow_layers(art):
    # Lift the drawn arrow off the bow. Fill the narrow strip behind its shaft
    # from the adjacent sleeve and bow so the arrow can travel independently.
    base = art.copy()
    for x in range(118, 234):
        top = round(166 - (x - 118) * 0.036)
        bottom = top + 9
        above, below = art.getpixel((x, top - 1)), art.getpixel((x, bottom + 1))
        for y in range(top, bottom + 1):
            mix = (y - top + 1) / (bottom - top + 2)
            base.putpixel((x, y), tuple(round(a + (b - a) * mix) for a, b in zip(above, below)))
    head = [(232, 158), (238, 156), (257, 165), (256, 171), (237, 181), (231, 181)]
    ImageDraw.Draw(base).polygon(head, fill=(0, 0, 0, 0))
    arrow = Image.new("RGBA", art.size)
    pen = ImageDraw.Draw(arrow)
    pen.line([(120, 171), (237, 166)], fill="#331842", width=7)
    pen.line([(120, 171), (237, 166)], fill="#b98d87", width=2)
    head_mask = Image.new("L", art.size)
    ImageDraw.Draw(head_mask).polygon(head, fill=255)
    arrow.paste(art, mask=head_mask)
    return base, arrow


def shot(art, base, arrow, t):
    if t < 0.35:
        distance = -10 * (1 - cos(pi * t / 0.35)) / 2
    elif t < 0.47:
        distance = -10 + 53 * (t - 0.35) / 0.12
    else:
        distance = 43
    frame = base.copy()
    # The point follows the shaft's slight upward slope into the bullseye.
    frame.alpha_composite(arrow, (round(distance), -round(distance * 0.035)))
    if t > 0.83:
        return Image.blend(frame, art, (t - 0.83) / 0.17)
    return frame


def render(name, rest_ms):
    art = Image.open(ART / f"{name}.png").convert("RGBA")
    layers = arrow_layers(art) if name == "down-10kg" else None
    frames = []
    for index in range(21):
        t = index / 20
        if index in (0, 20):
            frame = art.copy()
        elif layers:
            frame = shot(art, *layers, t)
        elif name == "goal-setter":
            frame = glint(art, (183, 60, 296, 155), t)
        elif name == "consistent":
            frame = glint(art, (6, 12, 130, 139), t)
        elif name == "moonkeeper":
            frame = glint(art, (12, 78, 171, 271), t)
        else:
            cycles = 2 if name in ("warrior", "dedicated", "first-steps", "comeback") else 1
            frame = bend(art, PINS[name], (1 - cos(2 * pi * cycles * t)) / 2)
        frame.thumbnail((160, 160), Image.Resampling.LANCZOS)
        frames.append(frame)
    output = ART / f"{name}-motion.webp"
    # One pose at rest closes each loop. Vary the rests so the shelf feels quiet.
    frames[0].save(output, save_all=True, append_images=frames[1:-1],
                   duration=[rest_ms] + [FRAME_MS] * 19, loop=0, quality=80,
                   minimize_size=True, allow_mixed=True, method=5)


if __name__ == "__main__":
    for badge, rest in [("first-steps", 850), ("warrior", 350), ("dedicated", 1450),
                        ("consistent", 1900), ("goal-setter", 1100),
                        ("down-5kg", 1650), ("down-10kg", 600),
                        ("trailblazer", 950), ("moonkeeper", 1700), ("comeback", 1150)]:
        render(badge, rest)

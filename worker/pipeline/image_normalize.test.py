from pathlib import Path

from PIL import Image

from pipeline.image_normalize import normalize_job_image


def test_normalize_ico_to_jpg(tmp_path: Path) -> None:
    ico = tmp_path / "img_000.ico"
    Image.new("RGB", (32, 32), color=(120, 40, 200)).save(ico, format="ICO", sizes=[(32, 32)])

    out = normalize_job_image(ico)
    assert out.suffix == ".jpg"
    assert out.exists()
    assert not ico.exists()
    with Image.open(out) as im:
        assert im.size == (32, 32)


def test_passthrough_jpeg(tmp_path: Path) -> None:
    jpg = tmp_path / "photo.jpg"
    Image.new("RGB", (64, 48), color=(10, 20, 30)).save(jpg, "JPEG")
    out = normalize_job_image(jpg)
    assert out == jpg

from pathlib import Path
from paddleocr import PaddleOCR


_ocr = None


def get_ocr():
    global _ocr

    if _ocr is None:
        _ocr = PaddleOCR(
            lang="en",
        )

    return _ocr


def extract_text(image_path: str):
    image_path = str(Path(image_path))

    ocr = get_ocr()

    result = ocr.predict(image_path)

    extracted_text = []

    for page in result:
        if hasattr(page, "json"):
            data = page.json
        else:
            data = page

        if isinstance(data, dict):
            res = data.get("res", data)
            texts = res.get("rec_texts", [])

            for text in texts:
                if text and text.strip():
                    extracted_text.append(text.strip())

    return {
        "text": extracted_text,
        "full_text": "\n".join(extracted_text),
    }
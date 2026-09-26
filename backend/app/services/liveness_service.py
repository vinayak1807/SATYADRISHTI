from pathlib import Path

import cv2
import numpy as np


def analyze_liveness(image_path: str):
    image_path = str(Path(image_path))

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(
            f"Could not read image: {image_path}"
        )

    height, width = image.shape[:2]

    if height == 0 or width == 0:
        raise ValueError(
            "Invalid image dimensions."
        )

    # Basic image-quality measurements
    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY,
    )

    brightness = float(np.mean(gray))
    contrast = float(np.std(gray))

    laplacian = cv2.Laplacian(
        gray,
        cv2.CV_64F,
    )

    sharpness = float(
        laplacian.var()
    )

    return {
        "analysisCompleted": True,

        "imageQuality": {
            "width": width,
            "height": height,
            "brightness": round(brightness, 2),
            "contrast": round(contrast, 2),
            "sharpness": round(sharpness, 2),
        },

        "livenessAssessment": {
            "status": "requires_review",
            "message": (
                "Basic image-quality analysis completed. "
                "Dedicated anti-spoofing analysis is required "
                "for stronger liveness assessment."
            ),
        },

        "requiresOfficerReview": True,
    }
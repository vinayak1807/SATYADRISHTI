from pathlib import Path

import cv2
import numpy as np


def analyze_tampering(image_path: str):

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

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY,
    )

    # JPEG compression / image quality indicator
    laplacian = cv2.Laplacian(
        gray,
        cv2.CV_64F,
    )

    sharpness = float(
        laplacian.var()
    )

    # Edge analysis
    edges = cv2.Canny(
        gray,
        100,
        200,
    )

    edge_density = float(
        np.mean(edges > 0)
    )

    # Basic image statistics
    brightness = float(
        np.mean(gray)
    )

    contrast = float(
        np.std(gray)
    )

    indicators = []

    if contrast < 15:
        indicators.append(
            "Very low image contrast."
        )

    if sharpness < 30:
        indicators.append(
            "Low image sharpness or possible image degradation."
        )

    if edge_density < 0.01:
        indicators.append(
            "Unusually low edge density."
        )

    if not indicators:
        indicators.append(
            "No basic image-quality anomaly detected."
        )

    return {
        "analysisCompleted": True,

        "imageProperties": {
            "width": width,
            "height": height,
            "brightness": round(
                brightness,
                2,
            ),
            "contrast": round(
                contrast,
                2,
            ),
            "sharpness": round(
                sharpness,
                2,
            ),
            "edgeDensity": round(
                edge_density,
                4,
            ),
        },

        "tamperingAssessment": {
            "status": "requires_review",
            "indicators": indicators,
            "message": (
                "Basic image-analysis checks completed. "
                "These indicators are not sufficient by "
                "themselves to determine whether a document "
                "is genuine or forged."
            ),
        },

        "requiresOfficerReview": True,
    }
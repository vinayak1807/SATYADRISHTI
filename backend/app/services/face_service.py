from pathlib import Path

import cv2
from insightface.app import FaceAnalysis


_face_app = None


def get_face_app():
    global _face_app

    if _face_app is None:
        _face_app = FaceAnalysis(
            allowed_modules=["detection"]
        )

        _face_app.prepare(
            ctx_id=0,
            det_size=(640, 640),
        )

    return _face_app


def detect_faces(image_path: str):
    image_path = str(Path(image_path))

    # Load image from file
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(
            f"Could not read image: {image_path}"
        )

    # Load InsightFace detector
    app = get_face_app()

    # InsightFace expects the actual image array
    faces = app.get(image)

    face_results = []

    for index, face in enumerate(faces):
        bbox = face.bbox.tolist()

        face_results.append(
            {
                "faceIndex": index + 1,
                "boundingBox": {
                    "x1": round(bbox[0], 2),
                    "y1": round(bbox[1], 2),
                    "x2": round(bbox[2], 2),
                    "y2": round(bbox[3], 2),
                },
                "detectionScore": round(
                    float(face.det_score),
                    4,
                ),
            }
        )

    return {
        "faceDetected": len(faces) > 0,
        "faceCount": len(faces),
        "faces": face_results,
    }
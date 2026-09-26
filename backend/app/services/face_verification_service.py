from pathlib import Path

import cv2
import numpy as np
from insightface.app import FaceAnalysis


_face_app = None


def get_face_app():
    global _face_app

    if _face_app is None:
        _face_app = FaceAnalysis()

        _face_app.prepare(
            ctx_id=0,
            det_size=(640, 640),
        )

    return _face_app


def get_single_face_embedding(image_path: str):
    image_path = str(Path(image_path))

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(
            f"Could not read image: {image_path}"
        )

    app = get_face_app()

    faces = app.get(image)

    if len(faces) == 0:
        raise ValueError(
            "No face detected in the image."
        )

    if len(faces) > 1:
        raise ValueError(
            "Multiple faces detected. Please provide an image containing one face."
        )

    face = faces[0]

    embedding = face.normed_embedding

    if embedding is None:
        raise ValueError(
            "Face embedding could not be generated."
        )

    return np.asarray(embedding, dtype=np.float32)


def compare_faces(
    document_image_path: str,
    live_image_path: str,
):
    document_embedding = get_single_face_embedding(
        document_image_path
    )

    live_embedding = get_single_face_embedding(
        live_image_path
    )

    similarity = float(
        np.dot(
            document_embedding,
            live_embedding,
        )
    )

    similarity = max(-1.0, min(1.0, similarity))

    return {
        "comparisonCompleted": True,
        "similarity": round(similarity, 4),
        "documentFaceDetected": True,
        "liveFaceDetected": True,
        "requiresOfficerReview": True,
    }
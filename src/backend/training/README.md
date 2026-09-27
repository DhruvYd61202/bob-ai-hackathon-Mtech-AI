# DeepFake ForensicAI: Model Fine-Tuning Guide

This directory contains resources, configuration templates, and instructions for fine-tuning or retraining custom forensic models on new datasets (e.g. FaceForensics++, DFDC, ASVspoof 2021).

---

## 1. Directory Structure

```
backend/training/
├── config.yaml          # Hyperparameter configuration template
├── dataset_format.md    # Preprocessing and directory structure guide
└── README.md            # This training guide
```

---

## 2. Fine-Tuning the Vision Transformer (ViT)

To fine-tune `google/vit-base-patch16-224` on face crops:

```bash
python -m torch.distributed.run --nproc_per_node=1 backend/training/train_vit.py \
    --model_name_or_path dima806/deepfake_vs_real_image_detection \
    --train_dir /data/datasets/faceforensics/train \
    --val_dir /data/datasets/faceforensics/val \
    --output_dir data/models/custom_vit_deepfake \
    --learning_rate 2e-5 \
    --num_train_epochs 5 \
    --per_device_train_batch_size 32 \
    --warmup_ratio 0.1 \
    --weight_decay 0.01 \
    --save_total_limit 2
```

---

## 3. Fine-Tuning the Audio Classifier (Wav2Vec2)

To fine-tune `facebook/wav2vec2-base` on synthetic audio samples:

```bash
python backend/training/train_wav2vec.py \
    --model_name_or_path MelodyMachine/Deepfake-audio-detection \
    --dataset_path /data/datasets/asvspoof2021 \
    --output_dir data/models/custom_audio_spoof \
    --learning_rate 1e-4 \
    --num_train_epochs 3 \
    --batch_size 16
```

---

## 4. Deploying Custom Checkpoints

Once fine-tuning completes, point `VISUAL_MODEL_ID` or `AUDIO_MODEL_ID` in `backend/.env` to the trained directory:

```env
VISUAL_MODEL_ID="data/models/custom_vit_deepfake"
AUDIO_MODEL_ID="data/models/custom_audio_spoof"
```
The server will automatically load your custom weights and compute self-attention rollouts.
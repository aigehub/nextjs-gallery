#!/usr/bin/env python3
"""Build a paged static index of the local media downloads.

Scans downloads/new_zhizun/{premium,middle}/<album>/ and emits:
  public/gallery-data/index/sections.json      — per-section album counts & page counts
  public/gallery-data/index/<section>/page-N.json — one page of album entries

Each album entry is a slim manifest: folder name, title, tier, price, city,
poster path, and counts of images/videos. Media files are served statically
directly from /gallery-media/<section>/<folder>/...
"""

import json
import os
import re
import sys

ROOT = "/home/lin/nextjs-gallery/downloads/new_zhizun"
OUT_DIR = "/home/lin/nextjs-gallery/public/gallery-data/index"
PAGE_SIZE = 24
SECTIONS = ["premium", "middle"]

# A video is stored as videos/video_001/video.mp4 (extensionless folder holding an mp4)
IMG_EXTS = {".webp", ".jpg", ".jpeg", ".png", ".gif"}


def list_images(album_dir: str):
    img_dir = os.path.join(album_dir, "images")
    if not os.path.isdir(img_dir):
        return []
    return sorted(
        f for f in os.listdir(img_dir)
        if os.path.splitext(f)[1].lower() in IMG_EXTS
    )


def list_videos(album_dir: str, sub: str):
    """Return playable video.mp4 paths inside videos/ or auth-videos/ subfolders."""
    vdir = os.path.join(album_dir, sub)
    out = []
    if not os.path.isdir(vdir):
        return out
    for entry in sorted(os.listdir(vdir)):
        full = os.path.join(vdir, entry)
        if os.path.isdir(full):
            for f in sorted(os.listdir(full)):
                if os.path.splitext(f)[1].lower() == ".mp4":
                    out.append(f"{sub}/{entry}/{f}")
        elif os.path.splitext(entry)[1].lower() == ".mp4":
            out.append(f"{sub}/{entry}")
    return out


def parse_folder_name(folder: str):
    # Pattern: <code>_<id>_<title...>
    m = re.match(r"^(\d+)_(\d+)_(.*)$", folder, re.S)
    if m:
        return m.group(1), m.group(2), m.group(3).strip()
    return "", "", folder.strip()


def build_album_entry(section: str, folder: str):
    album_dir = os.path.join(ROOT, section, folder)
    images = list_images(album_dir)
    videos = list_videos(album_dir, "videos")
    auth_videos = list_videos(album_dir, "auth-videos")

    meta = {}
    mpath = os.path.join(album_dir, "metadata.json")
    if os.path.isfile(mpath):
        try:
            with open(mpath, "r", encoding="utf-8") as fh:
                meta = json.load(fh)
        except Exception:
            meta = {}

    code, mid, folder_title = parse_folder_name(folder)
    title = meta.get("title") or folder_title or folder
    # poster path is relative to the album folder (SPA prepends section/folder).
    # Fall back to the first image when poster.webp is absent.
    if "poster.webp" in images:
        poster = "images/poster.webp"
    elif images:
        poster = f"images/{images[0]}"
    else:
        poster = None

    return {
        "f": folder,                                   # folder name = id for routing
        "t": title,                                    # display title
        "code": meta.get("code") or code,
        "city": meta.get("cityName") or "",
        "district": meta.get("districtName") or "",
        "addr": meta.get("address") or "",
        "price": meta.get("displayPrice"),
        "pinned": bool(meta.get("isPinned")),
        "certified": bool(meta.get("isCertified")),
        "poster": poster,
        "nImg": len(images),
        "nVid": len(videos),
        "nAuth": len(auth_videos),
    }


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    sections_summary = []

    for section in SECTIONS:
        sec_dir = os.path.join(ROOT, section)
        if not os.path.isdir(sec_dir):
            continue
        folders = [
            d for d in os.listdir(sec_dir)
            if os.path.isdir(os.path.join(sec_dir, d))
        ]
        folders.sort(key=lambda f: (0, -int(re.match(r"^\d+", f).group(0))) if re.match(r"^\d+", f) else (1, f))

        entries = []
        album_dir_out = os.path.join("/home/lin/nextjs-gallery/public/gallery-data/albums", section)
        os.makedirs(album_dir_out, exist_ok=True)
        for folder in folders:
            try:
                prev_len = len(entries)
                entries.append(build_album_entry(section, folder))
                entry = entries[-1]
                # Per-album detail manifest: slim lists the SPA fetches on open
                imgs = list_images(os.path.join(ROOT, section, folder))
                vids = list_videos(os.path.join(ROOT, section, folder), "videos")
                auths = list_videos(os.path.join(ROOT, section, folder), "auth-videos")
                payload = {
                    "f": folder,
                    "t": entry["t"],
                    "code": entry["code"],
                    "city": entry["city"],
                    "district": entry["district"],
                    "addr": entry["addr"],
                    "price": entry["price"],
                    "poster": f"images/poster.webp" if imgs and "poster.webp" in imgs else (f"images/{imgs[0]}" if imgs else None),
                    "images": [f"images/{n}" for n in imgs],
                    "videos": vids,
                    "authVideos": auths,
                }
                with open(os.path.join(album_dir_out, f"{folder}.json"), "w", encoding="utf-8") as fh:
                    json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
            except Exception as e:
                print(f"[warn] {section}/{folder}: {e}", file=sys.stderr)

        total = len(entries)
        pages = (total + PAGE_SIZE - 1) // PAGE_SIZE
        sec_out = os.path.join(OUT_DIR, section)
        os.makedirs(sec_out, exist_ok=True)

        for p in range(pages):
            chunk = entries[p * PAGE_SIZE:(p + 1) * PAGE_SIZE]
            with open(os.path.join(sec_out, f"page-{p+1}.json"), "w", encoding="utf-8") as fh:
                json.dump(chunk, fh, ensure_ascii=False, separators=(",", ":"))

        sections_summary.append({
            "id": section,
            "name": "premium 高端" if section == "premium" else "middle 中端",
            "albums": total,
            "pages": pages,
            "pageSize": PAGE_SIZE,
        })
        print(f"[{section}] {total} albums -> {pages} pages")

    with open(os.path.join(OUT_DIR, "sections.json"), "w", encoding="utf-8") as fh:
        json.dump({"sections": sections_summary}, fh, ensure_ascii=False, separators=(",", ":"))
    print("done.")


if __name__ == "__main__":
    main()

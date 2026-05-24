import { useEffect, useState } from "react";
import { fetchSiteVisualAssets } from "@/Api/siteVisualAssets.api";
import { absUrl } from "@/Utils/absUrl";

let visualAssetCache = null;

function getAssetSlot(item) {
  return item?.slotKey ?? item?.SlotKey ?? "";
}

function getAssetImage(item) {
  return item?.imageUrl ?? item?.ImageUrl ?? "";
}

function getAssetActive(item) {
  return (item?.isActive ?? item?.IsActive ?? true) === true;
}

function getAssetNumber(item, camelKey, pascalKey, fallback) {
  const value = Number(item?.[camelKey] ?? item?.[pascalKey] ?? fallback);
  return Number.isFinite(value) ? value : fallback;
}

export function getSiteVisualPlacementStyle(asset) {
  const x = Math.max(0, Math.min(100, getAssetNumber(asset, "imagePositionX", "ImagePositionX", 50)));
  const y = Math.max(0, Math.min(100, getAssetNumber(asset, "imagePositionY", "ImagePositionY", 50)));
  const scale = Math.max(1, Math.min(3, getAssetNumber(asset, "imageScale", "ImageScale", 1)));

  return {
    objectPosition: `${x}% ${y}%`,
    transform: `scale(${scale})`,
    transformOrigin: `${x}% ${y}%`,
  };
}

function useSiteVisualAssetRecord(slotKey, fallbackSrc) {
  const [record, setRecord] = useState({
    src: fallbackSrc,
    asset: null,
    style: getSiteVisualPlacementStyle(null),
  });

  useEffect(() => {
    let active = true;

    const applyAsset = (assets) => {
      const asset = assets.find((item) => getAssetSlot(item) === slotKey);
      const imageUrl = getAssetImage(asset);
      const isActive = getAssetActive(asset);
      setRecord({
        src: isActive && imageUrl ? absUrl(imageUrl) : fallbackSrc,
        asset: asset || null,
        style: getSiteVisualPlacementStyle(asset),
      });
    };

    if (visualAssetCache) {
      applyAsset(visualAssetCache);
      return () => {
        active = false;
      };
    }

    fetchSiteVisualAssets()
      .then((assets) => {
        visualAssetCache = assets;
        if (active) applyAsset(assets);
      })
      .catch(() => {
        if (active) {
          setRecord({
            src: fallbackSrc,
            asset: null,
            style: getSiteVisualPlacementStyle(null),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [fallbackSrc, slotKey]);

  return record;
}

export function useSiteVisualAsset(slotKey, fallbackSrc) {
  return useSiteVisualAssetRecord(slotKey, fallbackSrc).src;
}

export function useSiteVisualAssetView(slotKey, fallbackSrc) {
  return useSiteVisualAssetRecord(slotKey, fallbackSrc);
}

export function clearSiteVisualAssetCache() {
  visualAssetCache = null;
}

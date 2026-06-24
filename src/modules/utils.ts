// Utility functions for WTR Lab Term Replacer
import { CHAPTER_BODY_SELECTOR } from "./config"

export interface ReaderUrlContext {
	lang: string
	rawId: string | null
	novelSlug: string | null
	chapterSlug: string | null
}

export function getReaderContextFromPath(pathname = window.location.pathname): ReaderUrlContext {
	const parts = pathname.split("/").filter(Boolean)
	const novelIndex = parts.indexOf("novel")
	if (novelIndex >= 0) {
		return {
			lang: novelIndex > 0 ? parts[0] || "en" : "en",
			rawId: parts[novelIndex + 1] || null,
			novelSlug: parts[novelIndex + 2] || null,
			chapterSlug: parts[novelIndex + 3] || null,
		}
	}

	const serieIndex = parts.findIndex((part) => /^serie-\d+$/.test(part))
	if (serieIndex >= 0) {
		const rawId = parts[serieIndex].replace(/^serie-/, "") || null
		return {
			lang: serieIndex > 0 ? parts[0] || "en" : "en",
			rawId,
			novelSlug: parts[serieIndex + 1] || null,
			chapterSlug: parts[serieIndex + 2] || null,
		}
	}

	return {
		lang: parts[0] || "en",
		rawId: null,
		novelSlug: null,
		chapterSlug: null,
	}
}

export function getNovelSlug() {
	return getReaderContextFromPath().novelSlug
}

export function escapeRegExp(str) {
	return str.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")
}

export function debounce(func, delay) {
	let timeout
	return function (...args) {
		clearTimeout(timeout)
		timeout = setTimeout(() => func.apply(this, args), delay)
	}
}

export function getChapterIdFromUrl(url) {
	const match = url.match(/(chapter-\d+)/)
	return match ? match[1] : null
}

export function getChapterNoFromUrl(url = window.location.href) {
	const match = url.match(/chapter-(\d+)/)
	return match ? match[1] : null
}

function queryFirst(root: Document | Element = document, selectors: string[]) {
	for (const selector of selectors.filter(Boolean)) {
		const match = root.querySelector(selector)
		if (match) {
			return match
		}
	}
	return null
}

export function findChapterBodyById(chapterIdOrNo, root: Document | Element = document) {
	if (!chapterIdOrNo) {
		return null
	}

	const rawValue = String(chapterIdOrNo)
	const chapterNo = rawValue.match(/\d+/)?.[0]
	const chapterId = rawValue.startsWith("chapter-") ? rawValue : chapterNo ? `chapter-${chapterNo}` : rawValue
	const selectors = [
		`#${chapterId} ${CHAPTER_BODY_SELECTOR}`,
		chapterNo ? `#tracker-${chapterNo} ${CHAPTER_BODY_SELECTOR}` : "",
		chapterNo ? `.chapter-tracker[data-chapter-no="${chapterNo}"] ${CHAPTER_BODY_SELECTOR}` : "",
		chapterNo ? `[data-chapter-no="${chapterNo}"] ${CHAPTER_BODY_SELECTOR}` : "",
	]

	return queryFirst(root, selectors)
}

export function findChapterBodyForUrl(root: Document | Element = document, url = window.location.href) {
	const chapterId = getChapterIdFromUrl(url)
	const chapterNo = getChapterNoFromUrl(url)
	const selectors = [
		chapterId ? `#${chapterId} ${CHAPTER_BODY_SELECTOR}` : "",
		chapterNo ? `#tracker-${chapterNo} ${CHAPTER_BODY_SELECTOR}` : "",
		chapterNo ? `.chapter-tracker.active[data-chapter-no="${chapterNo}"] ${CHAPTER_BODY_SELECTOR}` : "",
		chapterNo ? `.chapter-tracker[data-chapter-no="${chapterNo}"] ${CHAPTER_BODY_SELECTOR}` : "",
		chapterNo ? `[data-chapter-no="${chapterNo}"] ${CHAPTER_BODY_SELECTOR}` : "",
		`.chapter-tracker.active ${CHAPTER_BODY_SELECTOR}`,
		`.chapter-container[id^="chapter-"] ${CHAPTER_BODY_SELECTOR}`,
		CHAPTER_BODY_SELECTOR,
	]

	return queryFirst(root, selectors)
}

export function findChapterContainerForUrl(root: Document | Element = document, url = window.location.href) {
	const chapterBody = findChapterBodyForUrl(root, url)
	if (chapterBody) {
		return chapterBody.closest(".chapter-container, .chapter-tracker, article, main") || chapterBody
	}

	const chapterId = getChapterIdFromUrl(url)
	const chapterNo = getChapterNoFromUrl(url)
	const selectors = [
		chapterId ? `#${chapterId}` : "",
		chapterNo ? `#tracker-${chapterNo}` : "",
		chapterNo ? `.chapter-tracker.active[data-chapter-no="${chapterNo}"]` : "",
		chapterNo ? `.chapter-tracker[data-chapter-no="${chapterNo}"]` : "",
		".chapter-tracker.active",
		'.chapter-container[id^="chapter-"]',
	]

	return queryFirst(root, selectors)
}

export function getChapterProcessingId(url = window.location.href, chapterBody = null) {
	const urlChapterId = getChapterIdFromUrl(url)
	if (urlChapterId) {
		return urlChapterId
	}

	const trackerChapterNo = chapterBody?.closest?.(".chapter-tracker")?.getAttribute("data-chapter-no")
	if (trackerChapterNo) {
		return `chapter-${trackerChapterNo}`
	}

	const containerId = chapterBody?.closest?.('.chapter-container[id^="chapter-"]')?.id
	if (containerId) {
		return containerId
	}

	const apiChapterId = chapterBody?.getAttribute?.("data-chapter-id")
	return apiChapterId ? `api-chapter-${apiChapterId}` : null
}

export function log(globalSettings, ...args) {
	if (globalSettings && globalSettings.isLoggingEnabled) {
		console.log(...args)
	}
}


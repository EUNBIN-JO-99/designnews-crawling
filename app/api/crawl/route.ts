import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

// designcompass.org/magazine/ 전용 크롤러
// cheerio로 HTML을 파싱해 최근 7일 이내 기사만 추출
export async function GET() {
  try {
    const targetUrl = "https://designcompass.org/magazine/";

    // axios로 HTML 가져오기 (User-Agent 설정)
    const { data: html } = await axios.get(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    // cheerio로 HTML 파싱
    const $ = cheerio.load(html);

    // KST 기준 오늘 날짜 계산
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
    const kstNow = new Date(now.getTime() + kstOffset);
    const todayKST = new Date(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate(),
    );

    // 7일 전 날짜 (KST 기준)
    const sevenDaysAgo = new Date(todayKST);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // /2025/ 또는 /2026/ 형태의 href를 가진 <a> 태그 추출
    const datePattern = /\/(2025|2026)\/(\d{2})\/(\d{2})\//;
    const items: { title: string; url: string; date: string }[] = [];
    const seen = new Set<string>(); // 중복 URL 방지

    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      // 날짜 패턴 매칭
      const match = href.match(datePattern);
      if (!match) return;

      // URL에서 날짜 파싱: /2026/03/30/ → 2026-03-30
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      const articleDate = new Date(year, month - 1, day);
      const dateStr = `${year}-${match[2]}-${match[3]}`;

      // 7일 이내 필터링
      if (articleDate < sevenDaysAgo || articleDate > todayKST) return;

      // <a> 태그 안의 텍스트를 title로 사용 (이미지만 있는 태그는 건너뜀)
      const rawText = $(el).text().trim();
      if (!rawText || rawText.startsWith("<")) return;

      // 절대 URL 변환
      const fullUrl = href.startsWith("http")
        ? href
        : `https://designcompass.org${href}`;

      // 중복 제거 (같은 URL에 대해 텍스트 제목이 있는 <a>만 저장)
      if (seen.has(fullUrl)) return;
      seen.add(fullUrl);

      items.push({ title: rawText, url: fullUrl, date: dateStr });
    });

    // 날짜 내림차순 정렬 (최신순)
    items.sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    console.error("크롤링 에러:", error);
    return NextResponse.json(
      { error: "크롤링 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

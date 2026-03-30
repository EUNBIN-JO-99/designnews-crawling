"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

// 크롤링 결과 아이템 타입
interface CrawlItem {
  title: string;
  url: string;
  date: string;
}

export default function Home() {
  // URL 입력값
  const [url, setUrl] = useState("https://designcompass.org/magazine/");
  // 크롤링 결과 목록
  const [results, setResults] = useState<CrawlItem[]>([]);
  // 로딩 상태
  const [loading, setLoading] = useState(false);
  // 에러 메시지
  const [error, setError] = useState("");

  // "불러오기" 버튼 클릭 시 실행
  const handleFetch = async () => {
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch("/api/crawl");

      // 응답이 실패인 경우
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "크롤링에 실패했어요.");
      }

      const data = await res.json();
      setResults(data.items);
    } catch (err) {
      // 사용자에게 에러 메시지 표시
      setError(err instanceof Error ? err.message : "알 수 없는 에러가 발생했어요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-4xl flex-col gap-8 py-16 px-4 md:px-8">
        {/* 헤더 */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            디자인 뉴스 크롤러
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            불러오기 버튼을 누르면 최근 7일 이내 기사를 가져와요.
          </p>
        </div>

        {/* URL 입력 + 불러오기 버튼 */}
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://designcompass.org/magazine/"
            className="flex-1 h-12 rounded-lg border border-zinc-300 bg-white px-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
          />
          <button
            onClick={handleFetch}
            disabled={loading || !url.trim()}
            className="h-12 rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            불러오기
          </button>
        </div>

        {/* 로딩 스피너 */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-12">
            <svg
              className="h-5 w-5 animate-spin text-zinc-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              크롤링 중이에요...
            </span>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {/* 엑셀 다운로드 버튼 */}
        {results.length > 0 && (
          <button
            onClick={() => {
              // 테이블 데이터를 엑셀 시트 형식으로 변환
              const sheetData = results.map((item, idx) => ({
                번호: idx + 1,
                날짜: item.date,
                제목: item.title,
                링크: item.url,
              }));
              const worksheet = XLSX.utils.json_to_sheet(sheetData);
              const workbook = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(workbook, worksheet, "크롤링 결과");

              // 오늘 날짜로 파일명 생성 (YYYY-MM-DD)
              const today = new Date().toISOString().slice(0, 10);
              XLSX.writeFile(workbook, `crawl-result-${today}.xlsx`);
            }}
            className="self-start h-12 rounded-lg border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            엑셀 다운로드
          </button>
        )}

        {/* 결과 테이블 */}
        {results.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">
                    번호
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">
                    날짜
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">
                    제목
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">
                    링크
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, idx) => (
                  <tr
                    key={item.url}
                    className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {idx + 1}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {item.date}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        바로가기
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
}

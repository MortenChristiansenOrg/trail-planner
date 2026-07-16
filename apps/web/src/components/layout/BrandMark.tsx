export function BrandMark() {
  return (
    <svg aria-hidden="true" className="brand__mark" viewBox="0 0 40 40">
      <rect height="38" rx="10" width="38" x="1" y="1" />
      <path className="brand__contour" d="M7 14.5c5.5-5.8 12.8-6.7 19.1-2.8 3.5 2.2 5.6 5.9 6.9 10.3" />
      <path className="brand__contour" d="M7.2 20.2c4.1-4 8.8-5.5 13.3-4.1 4.7 1.5 7.6 5.4 9.1 10.8" />
      <path className="brand__trail" d="M8.5 29.5c3.4-1 4.7-4.4 7.4-5.3 3.5-1.2 4.7 1.1 7.2-2.3 2.1-2.8 3-7.4 7.8-10.6" />
      <circle className="brand__waypoint" cx="8.5" cy="29.5" r="2.5" />
      <circle className="brand__summit" cx="30.9" cy="11.3" r="2" />
    </svg>
  );
}

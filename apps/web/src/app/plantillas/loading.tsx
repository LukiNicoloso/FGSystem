export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-40 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-48 bg-gray-100 rounded mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 items-center">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-5 bg-gray-100 rounded-full w-20" />
            <div className="h-4 bg-gray-100 rounded w-1/5 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

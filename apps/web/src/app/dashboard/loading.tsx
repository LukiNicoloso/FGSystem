export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-56 bg-gray-100 rounded mb-6" />
      <div className="flex gap-2 mb-4">
        <div className="h-8 w-28 bg-gray-200 rounded-lg" />
        <div className="h-8 w-36 bg-gray-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-5 bg-gray-100 rounded-full w-1/2" />
            <div className="flex gap-2">
              <div className="h-7 bg-gray-100 rounded-lg w-20" />
              <div className="h-7 bg-gray-100 rounded-lg w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

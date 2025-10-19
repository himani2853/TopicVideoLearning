export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="loading-spinner w-8 h-8"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
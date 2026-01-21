const MiniFeature = ({ title, body }: { title: string; body: string }) => {
  return (
    <div className="border rounded-xl p-4 bg-white/60">
    <div className="font-semibold">{title}</div>
    <div className="text-sm text-gray-700 mt-1">{body}</div>
  </div>
  )
}

export default MiniFeature

const Stat = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
  )
}

export default Stat
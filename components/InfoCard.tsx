const InfoCard = ({
    title,
    body,
    icon,
  }: {
    title: string;
    body: string;
    icon: string;
  }) => {
  return (
    <div className="border rounded-2xl p-5 bg-white shadow-sm">
      <div className="text-2xl">{icon}</div>
      <h3 className="font-semibold mt-2">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{body}</p>
    </div>
  )
}

export default InfoCard
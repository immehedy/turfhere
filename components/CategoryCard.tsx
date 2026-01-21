import Image from "next/image";
import Link from "next/link";

const CategoryCard = ({
    title,
    subtitle,
    img,
    href,
  }: {
    title: string;
    subtitle: string;
    img: string;
    href: string;
  }) => {
  return (
    <Link
      href={href}
      className="border rounded-2xl overflow-hidden bg-white hover:shadow-sm transition">
      <div className="aspect-4/3 bg-gray-100">
        <Image
          src={img}
          alt={title}
          width={800}
          height={600}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-gray-600 mt-1">{subtitle}</div>
      </div>
    </Link>
  )
}

export default CategoryCard
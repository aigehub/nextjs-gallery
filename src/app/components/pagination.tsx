"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { generatePagination } from "@/app/libs/utils";
import { usePathname, useSearchParams } from "next/navigation";

export default function Pagination({
  totalPages,
  className,
}: {
  totalPages: number;
  className?: string;
}) {
  // NOTE: Uncomment this code in Chapter 11

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const allPages = generatePagination(currentPage, totalPages);
  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    const url = `${pathname}?${params.toString()}`;
    return url;
  };
  const item_width =
    "md:h-10 md:w-10 max-sm:w-8 max-sm:h-8 text-sm justify-center items-center ";
  return (
    <>
      {/*  NOTE: Uncomment this code in Chapter 11 */}

      <div className={clsx("inline-flex", className)}>
        <PaginationArrow
          className={item_width}
          direction="left"
          href={createPageURL(currentPage - 1)}
          isDisabled={currentPage <= 1}
        />

        <div className="flex -space-x-px">
          {allPages.map((page, index) => {
            let position: "first" | "last" | "single" | "middle" | undefined;

            if (index === 0) position = "first";
            if (index === allPages.length - 1) position = "last";
            if (allPages.length === 1) position = "single";
            if (page === "...") position = "middle";

            return (
              <PaginationNumber
                className={item_width}
                key={`${page}-${index}`}
                href={createPageURL(page)}
                page={page}
                position={position}
                isActive={currentPage === page}
              />
            );
          })}
        </div>

        <PaginationArrow
          className={item_width}
          direction="right"
          href={createPageURL(currentPage + 1)}
          isDisabled={currentPage >= totalPages}
        />
      </div>
    </>
  );
}

function PaginationNumber({
  page,
  href,
  isActive,
  position,
  className,
}: {
  page: number | string;
  href: string;
  position?: "first" | "last" | "middle" | "single";
  isActive: boolean;
  className?: string;
}) {
  const classNameClsx = clsx(
    "flex items-center justify-center  border",
    className,
    {
      "rounded-l-md": position === "first" || position === "single",
      "rounded-r-md": position === "last" || position === "single",
      "z-10 bg-blue-600 border-blue-600 text-white": isActive,
      "hover:bg-gray-100": !isActive && position !== "middle",
      "text-gray-300": position === "middle",
    }
  );

  return isActive || position === "middle" ? (
    <div className={classNameClsx}>{page}</div>
  ) : (
    <Link href={href} className={classNameClsx}>
      {page}
    </Link>
  );
}

function PaginationArrow({
  href,
  direction,
  isDisabled,
  className,
}: {
  href: string;
  direction: "left" | "right";
  isDisabled?: boolean;
  className?: string;
}) {
  const classNameClsx = clsx(
    "flex items-center justify-center rounded-md border",
    className,
    {
      "pointer-events-none text-gray-300": isDisabled,
      "hover:bg-gray-100": !isDisabled,
      "mr-2 md:mr-4": direction === "left",
      "ml-2 md:ml-4": direction === "right",
    }
  );

  const icon =
    direction === "left" ? (
      <ArrowLeftIcon className="w-4" />
    ) : (
      <ArrowRightIcon className="w-4" />
    );

  return isDisabled ? (
    <div className={classNameClsx}>{icon}</div>
  ) : (
    <Link className={classNameClsx} href={href}>
      {icon}
    </Link>
  );
}

"use client";
import clsx from "clsx";
import { wrappedSearchAction } from "../libs/actions";

export default function SearchComponent(props: {
  page?: number;
  name?: string;
  max_price?: number;
  province?: string;
  district?: string;
  bust?: string;
  plat?: number;
}) {
  const searcAction = wrappedSearchAction.bind(null);
  let width = "sm:max-w-[6rem]";
  return (
    <form action={searcAction} className="max-sm:w-full mt-4">
      <input type="hidden" name="page" value={props.page} />
      <input type="hidden" name="p" value={props.plat} />
      <div className="md:flex gap-2 m-2 items-end">
        {props.plat != 4 && (
          <div className={clsx("flex flex-col", width)}>
            {/* search 省市 */}
            {/* <label htmlFor="province">省市:</label> */}
            <input
              type="text"
              name="province"
              id="privice"
              placeholder="查询省市"
              defaultValue={props.province}
              className="border cursor-pointer rounded  p-1  border-blue-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // 禁止提交
                  // 这里也可以手动调搜索逻辑
                }
              }}
            />
          </div>
        )}
        {props.plat != 4 && (
          <div className={clsx("flex flex-col", width)}>
            {/* search 地区 */}
            {/* <label htmlFor="district">地区:</label> */}
            <input
              type="text"
              name="district"
              id="district"
              placeholder="地区"
              defaultValue={props.district}
              className="border cursor-pointer rounded  p-1  border-blue-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // 禁止提交
                  // 这里也可以手动调搜索逻辑
                }
              }}
            />
          </div>
        )}
        <div className={clsx("flex flex-col", width)}>
          {/* search 名称或编号 */}
          {/* <label htmlFor="name">名称或编号:</label> */}
          <input
            type="text"
            name="name"
            id="name"
            placeholder="名称或编号"
            defaultValue={props.name}
            className="border cursor-pointer rounded  p-1  border-blue-400"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // 禁止提交
                // 这里也可以手动调搜索逻辑
              }
            }}
          />
        </div>
        {props.plat != 4 && (
          <div className={clsx("flex flex-col", width)}>
            {/* search 胸围 */}
            {/* <label htmlFor="bust">Bust:</label> */}
            <input
              type="text"
              name="bust"
              id="bust"
              placeholder="bust"
              defaultValue={props.bust}
              className="border cursor-pointer rounded  p-1  border-blue-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // 禁止提交
                  // 这里也可以手动调搜索逻辑
                }
              }}
            />
          </div>
        )}
        {props.plat != 4 && (
          <div className={clsx("flex flex-col", width)}>
            {/* search 价格 */}
            {/* <label htmlFor="maxPrice">Max Price:</label> */}
            <input
              type="text"
              name="max price"
              id="maxPrice"
              defaultValue={props.max_price}
              placeholder="Max Price"
              className="border cursor-pointer rounded  p-1  border-blue-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // 禁止提交
                  // 这里也可以手动调搜索逻辑
                }
              }}
            />
          </div>
        )}
        <div className="flex flex-col">
          {/* submit 提交按钮 */}
          <button
            type="submit"
            name="max price"
            id="submit"
            className="min-w-20 mt-2 text-white rounded cursor-pointer p-1  bg-blue-400 hover:bg-blue-600"
          >
            搜索
          </button>
        </div>
      </div>
    </form>
  );
}

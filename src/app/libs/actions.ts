"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ✅ 包装成只接收 FormData 的函数
export const wrappedSearchAction = async (formData: FormData) => {
  console.log(formData);
  const page = formData.get("page") ? Number(formData.get("page")) : undefined;
  const max_price = formData.get("max_price") ? Number(formData.get("max_price")) : undefined;
  const province = formData.get("province")?.toString();
  const bust = formData.get("bust")?.toString();
  const name = formData.get("name")?.toString();
  const district = formData.get("district")?.toString();
  const platform = formData.get("p")?.toString();

  await searchAction({
    props: { page, max_price, province, bust, district, name, platform },
  });
};

export async function searchAction({
  props,
}: {
  props: {
    page?: number;
    max_price?: number;
    province?: string;
    bust?: string;
    name?: string;
    district?: string;
    platform?: string;
  };
}) {
  // 这里可以调用异步函数获取数据
  const { page, max_price, province, bust, name, district, platform } = props;

  let path = "/?page=1";
  // 1. encode 用户输入
  if (max_price !== undefined) {
    path += "&max_price=" + encodeURIComponent(String(max_price));
  }
  if (bust) {
    path += "&bust=" + encodeURIComponent(bust);
  }
  if (province) {
    path += "&province=" + encodeURIComponent(province);
  }
  if (district) {
    path += "&district=" + encodeURIComponent(district);
  }
  if (name) {
    path += "&name=" + encodeURIComponent(name);
  }
  if (platform) {
    path += "&p=" + encodeURIComponent(platform);
  }

  revalidatePath(path);
  redirect(path);
}

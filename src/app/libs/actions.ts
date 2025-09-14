"use server"
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ✅ 包装成只接收 FormData 的函数
export const wrappedSearchAction = async (formData: FormData) => {
  console.log(formData)
  const page = formData.get("page") ? Number(formData.get("page")) : undefined;
  const max_price = formData.get("max_price")
    ? Number(formData.get("max_price"))
    : undefined;
  const province = formData.get("province")?.toString();
  const bust = formData.get("bust")?.toString();

  await searchAction({
    props: { page, max_price, province, bust },
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
  };
}) {
  // 这里可以调用异步函数获取数据
  const { page, max_price, province, bust } = props;

  let path = "/?page=1";
    // 1. encode 用户输入
  if (max_price) {
    path += "&max_price=" + encodeURIComponent(max_price);
  }
  if (bust) {
    path += "&bust=" + encodeURIComponent(bust);
  }
  if (province) {
    path += "&province=" + encodeURIComponent(province);
  }

  revalidatePath(path);
  redirect(path);
}

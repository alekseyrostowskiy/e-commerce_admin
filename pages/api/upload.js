import { mongooseConnect } from "@/lib/mongoose";
import multiparty from "multiparty";
import { isAdminRequest } from "./auth/[...nextauth]";

let EasyYandexS3 = require("easy-yandex-s3").default;
const bucketName = "next-ecommerce-alex";

export default async function handle(req, res) {
  await mongooseConnect();
  await isAdminRequest(req, res);

  const form = new multiparty.Form();
  const { fields, files } = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
  //   console.log(files);
  //   console.log(fields);

  let s3 = new EasyYandexS3({
    auth: {
      accessKeyId: process.env.YANDEX_ACCESS_KEY_ID,
      secretAccessKey: process.env.YANDEX_SECRET_ACCESS_KEY,
    },
    Bucket: bucketName, // например, "my-storage",
    debug: true, // Дебаг в консоли, потом можете удалить в релизе
  });
  const links = [];
  for (const file of files.file) {
    const ext = file.originalFilename.split(".").pop();
    const newFileName = Date.now() + "." + ext;
    let upload = await s3.Upload(
      {
        path: file.path,
        name: newFileName,
      },
      "/pictures/"
    );
    const link = `https://storage.yandexcloud.net/${bucketName}/pictures/${newFileName}`;
    links.push(link);
  }

  return res.json({ links });
}
export const config = {
  api: { bodyParser: false },
};

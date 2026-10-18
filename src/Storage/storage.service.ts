import { Injectable } from "@nestjs/common";
import { S3Client, HeadObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';


@Injectable()
export class StorageService {
    private client: S3Client;
    private bucket: string;
    private publicUrl: string;
    

    constructor() {
        const accessKey: string = process.env.ACCESS_KEY_R2 as string;
        const secretAccessKey: string = process.env.SECRET_ACCESS_KEY_R2 as string;
        const url = process.env.URL_R2;

        this.bucket = process.env.NAME_BUCKET_R2 as string;
        this.publicUrl = process.env.PUBLIC_URL_R2 as string;

        this.client = new S3Client({
            region: 'auto',
            endpoint: url,
            credentials: {
                accessKeyId: accessKey,
                secretAccessKey: secretAccessKey
            },
        })
    }

    async upload(key: string, file: Buffer, mimetype: string): Promise<void> {
    await this.client.send(
        new PutObjectCommand({
        Bucket: this.bucket,   // em qual bucket salvar (propriedade da classe)
        Key: key,              // o "caminho" do arquivo, ex: avatars/uuid.png
        Body: file,            // o conteúdo do arquivo (o buffer que o Multer te deu)
        ContentType: mimetype, // diz ao navegador que é imagem, para exibir em vez de baixar
        }),
    );
    }

    async delete(key: string): Promise<void> {
    await this.client.send(
        new DeleteObjectCommand({
        Bucket: this.bucket,   // onde
        Key: key,              // qual arquivo
        }),
    );
    }

    getUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
    }
}
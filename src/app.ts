// @ts-ignore
import express from '@swizzyweb/express';
import { SwizzyDynServeService } from './web-service';
const PORT = process.env.port ?? 3005;
const app = express();

const webSevice = new SwizzyDynServeService({});
webSevice.install({app})
app.listen(PORT, () => {
    console.info(`SwizzyDynServe running on port ${PORT}`);
});


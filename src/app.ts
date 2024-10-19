// @ts-ignore
import express, { Request, Response } from '@swizzyweb/express';
import { SwizzyDynServeService } from './web-service';
// @ts-ignore
import { SwizzyDynServeFrontendWebService } from '@swizzyweb/swizzy-dyn-serve-frontend-web-service';
const PORT = process.env.port ?? 3005;
const app = express();
/*app.use((req: Request, res: Response, next: any) => {
	req.app = app;
	next();
});*/
const webSevice = new SwizzyDynServeService({app});
webSevice.install({})
const frontendService = new SwizzyDynServeFrontendWebService({app});
frontendService.install({});
app.listen(PORT, () => {
    console.info(`SwizzyDynServe running on port ${PORT}`);
});


// @ts-ignore
import {Request, Response, Router, json} from '@swizzyweb/express'; 
import path from 'path';
import { IWebService } from '@swizzyweb/swizzy-web-service';
import { BrowserLogger, ILogger } from '../../../SwizzyCommon/dist';
import { npmInstall } from '../npm-installer';
import { validatePackageName } from '../npm-installer';

const logger: ILogger = new BrowserLogger();

export const router = Router({});
const BASE_PATH = '/v1/tool';
const FILE_NAME = "app.js";
// middleware that is specific to this router
const timeLog = (req: Request, res: Response, next: ()=>void) => {
  logger.log(`Time: ${new Date().toUTCString()}`);
  next()
}

router.use(timeLog);
router.use(json());
const runningTools: any = {};

interface InstallParams {
  toolName: string;
  toolUrl: string;
}

// define the home page route
router.post(`${BASE_PATH}/install`, async (req: Request, res: Response) => {
    // Use link since we are using local packages
    const { toolName } = req.query; 
      logger.info(`Request to install tool: ${toolName}`);
  try {
  	validatePackageName(toolName as string);
  	logger.info(`ToolName validated`);
  } catch(e) {
	logger.error(`Invalid package name when attempting to install exception: ${e}`);
	res.status(403).send();
	return;
  }
    try {
      const result = await npmInstall({packageName: toolName});
      if (!result.success) {
		throw new Error(`Install tool ${toolName} failed`);
	  }

	  logger.info(`Successfully installed package ${toolName}`);
      res.status(200).send();
    } catch(e) {
      logger.error(`Error occurred installing npm package ${toolName} with exception ${e}`);
      res.status(500).send();
    }
});



// With NPM
router.post(`${BASE_PATH}/run`, async (req: Request, res: Response) => {
  const {toolName} = req.query;
  logger.info(`Request to run tool: ${toolName}`);
  try {
  	validatePackageName(toolName as string);
  	logger.info(`ToolName validated`);
  } catch(e) {
	logger.error(`Invalid package name when attempting to run exception: ${e}`);
	res.status(403).send();
	return;
  }

  try {
    // const toolPath = path.join(`${WEB_SERVICE_LOCAL_REPO_PATH}/${toolName}/${FILE_NAME}`);
    // logger.info(`Toolpath to require: ${toolPath}`);
    // const tool = require(`../../local/repo/services/MyFirstWebService/app.js`);
    // const toolPath = path.join(`../../local/repo/services/${toolName}/${FILE_NAME}`);
    const toolFilePath = require.resolve(toolName);
    //let webService = tool.getWebservice();
    //await webService.install({app: req.app, logger});
    runningTools[toolName as string] = {file: toolFilePath};
    // tool.install({app: req.app});
    logger.info(`Started running tool: ${toolName}`);
  } catch(e) {
    logger.error(`Error running service: ${toolName}, e: ${e}`);
    res.status(500).send();
  }
  
  res.status(200).send();
});

router.post(`${BASE_PATH}/stop`, async (req: Request, res: Response) => {
  const {toolName} = req.query;
  logger.info(`Request to stop running tool: ${toolName}`);
  try {
  	validatePackageName(toolName as string);
  	logger.info(`ToolName validated`);
  } catch(e) {
	logger.error(`Invalid package name when attempting to stop exception: ${e}`);
	res.status(403).send();
	return;
  } 
  try {

    if(!runningTools[toolName as string]) {
      logger.error(`Unable to stop running service ${toolName} as it is not in available services`);
      res.status(404).send();
      return;
    }
    // const toolPath = path.join(`../../local/repo/services/${toolName}/${FILE_NAME}`);
    //const webService = runningTools[toolName as string]!;
    //logger.info(`Routes: ${req.app}`);
    //await webService.uninstall({app: req.app});
    delete runningTools[toolName as string];
    //delete require.cache[require.resolve(toolName as string)];
    // TODO: Should we do NPM uninstall during this step? Maybe an uninstall controller makes sense.
    logger.info(`Stopped running tool: ${toolName}`);
  } catch(e) {
    logger.error(`Error stopping service: ${toolName}, e: ${e}`);
    res.status(500).send();
  }
  
  res.status(200).send();
});

router.get(`${BASE_PATH}/download`, async (req: Request, res: Response) => {
  const toolName: string = req.query.toolName;
  logger.info(`Request to download tool: ${toolName}`);
  try {
  	validatePackageName(toolName as string);
  	logger.info(`ToolName validated`);
  } catch(e) {
	logger.error(`Invalid package name when attempting to stop exception: ${e}`);
	res.status(403).send();
	return;
  }

  try {
  		if (!runningTools[toolName as string]) {
		throw new Error(`Tool ${toolName} not installed`);
		}
	} catch(e) {
		logger.error(`Attempted to download tool ${toolName} that is not running`);
		res.status(404).send();
		return;
	}

  try {
  	console.log(`Downloading toolName: ${toolName} resolved at ${path.join(require.resolve(toolName))}`);
 	res.sendFile(runningTools[toolName].file);
  } catch(e) {
	  console.error(e);
  	res.status(500);
	res.send();
  }
});

router.get(`${BASE_PATH}/running/list`, (req: Request, res: Response) => {
  res.status(200).json({tools: runningTools});
});

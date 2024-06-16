import { exec } from "child_process";
import { BrowserLogger, ILogger } from "../../SwizzyCommon/dist";

const logger: ILogger = new BrowserLogger();
const SLEEP_INTERVAL = 2000;


export interface INpmLinkInstallProps {
    packageName: string;
}

export interface IInstallResult {
    success: boolean;
}
const LINK_COMMAND = "npm link ";
export async function npmLinkInstall(props: INpmLinkInstallProps): Promise<IInstallResult> {
   const { packageName } = props;
   validatePackageName(packageName);
	return await install(packageName, LINK_COMMAND);
}

const INSTALL_COMMAND = "npm install ";
export async function npmInstall(props: INpmLinkInstallProps) {
    const {packageName} = props;
	validatePackageName(packageName);
    return await install(packageName, INSTALL_COMMAND);
}

async function install(packageName: string, command: string): Promise<IInstallResult> {
    let a = exec(`${command} ${packageName}`, (err, stdout, stderr) => {
        if(err) {
            logger.error(`Error: ${err}`);
        }
        if(stdout) {
            logger.log(stdout);
        }
        if(stderr) {
            logger.error(stderr);
        }
    });

    while(a.exitCode == null) {
        console.log(`Still running, waiting ${SLEEP_INTERVAL} ms`);
        await sleep(SLEEP_INTERVAL);
    }

    console.log(a.exitCode);
    

    return Promise.resolve({success: true});
}

function sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

const PACKAGE_NAME_REGEX = new RegExp('^([@]*[a-zA-Z0-9-]+\/)?[a-zA-Z0-9-]+([a-zA-Z0-9-@.])+(?<!\.js)$');

export function validatePackageName(packageName: string) {
	
	if(!PACKAGE_NAME_REGEX.test(packageName)) {
		throw new Error(`Invalid package name provided, could be malicious! packageName: ${packageName}`);
	}
}

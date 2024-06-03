import { By, Builder, Browser, until } from "selenium-webdriver";
import {
  proxy,
  twitter_username,
  twitter_password,
  twitter_email,
} from "./constants.js";
import proxyChain from "proxy-chain";
import { uploadData } from "./mongodb.js";
import chrome from "selenium-webdriver/chrome.js";
import { ChromeDriverManager } from "webdriver-manager/chromedriver";

export async function seleniumPipeline() {
  let driver;
  try {
    const anonymizedProxy = await proxyChain.anonymizeProxy(proxy);
    const parsedUrl = new URL(anonymizedProxy);
    const proxyHost = parsedUrl.hostname;
    const proxyPort = parsedUrl.port;

    let options = new chrome.Options();
    // options.addArguments("--headless"); // Set headless mode
    options.addArguments("--disable-gpu"); 
    options.addArguments("--no-sandbox"); 
    options.addArguments("--disable-dev-shm-usage"); 

    const chromeDriverPath = ChromeDriverManager.getDriverPath();
    let service = new chrome.ServiceBuilder(chromeDriverPath).build();

    const newProxyString = `http://${proxyHost}:${proxyPort}`;
    driver = await new Builder()
      .withCapabilities({
        proxy: {
          proxyType: "manual",
          httpProxy: newProxyString,
          sslProxy: newProxyString,
        },
      })
      .forBrowser(Browser.CHROME)
      .setChromeOptions(options)
      .setChromeService(service)
      .build();
    
    console.log("Driver created.");

    await driver.manage().window().maximize();
    await driver.get("http://httpbin.org/ip");

    const preText = await driver.findElement(By.xpath("//pre")).getText();
    const ipInfo = JSON.parse(preText);
    console.log("IP Info:", ipInfo.origin);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    await driver.get("https://x.com/i/flow/login");

    const emailField = await driver.wait(
      until.elementLocated(By.name("text")),
      10000
    );
    await driver.wait(until.elementIsVisible(emailField), 10000);
    await driver.wait(until.elementIsEnabled(emailField), 10000);
    await emailField.sendKeys(twitter_email);

    const nextButton = await driver.wait(
      until.elementLocated(By.xpath("//span[text()='Next']")),
      10000
    );
    await driver.wait(until.elementIsVisible(nextButton), 10000);
    await driver.wait(until.elementIsEnabled(nextButton), 10000);

    await driver.executeScript(
      "arguments[0].scrollIntoView(true);",
      nextButton
    );
    await nextButton.click();

    try {
      const unusualLoginPrompt = await driver.wait(
        until.elementLocated(
          By.xpath("//span[text()='Enter your phone number or username']")
        ),
        5000
      );
      console.log("Detected unusual login prompt.");

      if (unusualLoginPrompt) {
        const usernameInput = await driver.wait(
          until.elementLocated(By.name("text")),
          10000
        );
        await driver.wait(until.elementIsVisible(usernameInput), 10000);
        await driver.wait(until.elementIsEnabled(usernameInput), 10000);
        await usernameInput.sendKeys(twitter_username);

        const proceedButton = await driver.wait(
          until.elementLocated(By.xpath("//span[text()='Next']")),
          10000
        );
        await driver.wait(until.elementIsVisible(proceedButton), 10000);
        await driver.wait(until.elementIsEnabled(proceedButton), 10000);

        await driver.executeScript(
          "arguments[0].scrollIntoView(true);",
          proceedButton
        );

        await proceedButton.click();
      }
    } catch (error) {
      console.log(error);
      console.log("Didnt detect Unusual login prompt.");
    }

    const passwordField = await driver.wait(
      until.elementLocated(By.name("password")),
      10000
    );
    await driver.wait(until.elementIsVisible(passwordField), 10000);
    await driver.wait(until.elementIsEnabled(passwordField), 10000);

    await passwordField.sendKeys(twitter_password);

    const loginFormButton = await driver.wait(
      until.elementLocated(By.css("[data-testid=LoginForm_Login_Button]")),
      10000
    );
    await driver.wait(until.elementIsVisible(loginFormButton), 10000);
    await driver.wait(until.elementIsEnabled(loginFormButton), 10000);

    await loginFormButton.click();
    await driver.manage().setTimeouts({ implicit: 5000 });

    const trendDivs = await driver.wait(
      until.elementsLocated(By.css("div[data-testid=trend]")),
      20000
    );

    const hashTagsList = [];
    for (const trendDiv of trendDivs) {
      const innerText = await trendDiv.getAttribute("innerText");
      const mainTag = innerText.split("\n")[1].trim();
      hashTagsList.push(mainTag);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    hashTagsList.splice(5);
    const finalData = {
      trends: hashTagsList,
      timestamp: new Date(),
      id: Math.floor(Math.random() * 1000000),
      ip: ipInfo.origin,
    };

    const mongoDoc = await uploadData(finalData);
    return { ...finalData, mongoDoc };
  } catch (e) {
    console.log(e);
  } finally {
    await driver.quit();
  }
}

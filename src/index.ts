import puppeteer, { KeyInput } from "puppeteer"
import { config } from "dotenv"

config()

function sleep(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const bot = async() => {
  const browser = await puppeteer.launch({ headless: false })
  const [page] = await browser.pages()
  
  await page.goto('https://tinyrpg-online-dist.miscerewebdev.repl.co/')

  await sleep(1000)

  const data = {
    user: process.env.TINY_USER || "",
    password: process.env.TINY_PASSWORD || "",
    lifeActionValue: process.env.HTML_LIFE_ACTION_VALUE || "",
    selectorLife: process.env.HTML_SELECTOR_LIFE || "",
    selectorPotion: process.env.HTML_SELECTOR_POTION || ""
  }

  await page.frames()[0].focus("#app > div.app-container.d-flex.justify-content-center.align-items-center.h-100 > div.mt-5.d-flex.justify-content-center.align-items-middle.flex-column.w-50 > div:nth-child(3) > input")
  
  //@ts-ignore
  data.user.split('').forEach( async (letter) => await page.keyboard.press(letter))

  //@ts-ignore
  await page.frames()[0].focus("#app > div.app-container.d-flex.justify-content-center.align-items-center.h-100 > div.mt-5.d-flex.justify-content-center.align-items-middle.flex-column.w-50 > div:nth-child(4) > input")
  //@ts-ignore
  data.password.split('').forEach( async (letter) => await page.keyboard.press(letter))

  //@ts-ignore
  await page.frames()[0].focus("#app > div.app-container.d-flex.justify-content-center.align-items-center.h-100 > div.mt-5.d-flex.justify-content-center.align-items-middle.flex-column.w-50 > button.btn.btn-outline-primary.mb-3")
  //@ts-ignore
  await page.keyboard.press('Enter')

  await page.waitForTimeout(1000)

  const response = await page.evaluate(async (data) => {
    
    let currentLife = 0
    let timeOff = 0   
    
    let life

    console.log("reload")

    const potions = () => {

      const inventory = document.querySelector('.list-group')?.querySelectorAll("li")

      //@ts-ignore
      const potions = [...inventory]
        .filter(
          item => item
            .querySelector('span')
            ?.textContent.indexOf('Potion') > -1
        )
        .map(element => {
          let [name, amount] = element.querySelector('span').textContent.split('x')
          name = name.trim()
          amount = Number(amount)

          const cure = Number(element.querySelector('small').textContent.replace('+','').replace('HP', '').trim())

          return {
            name,
            amount,
            cure,
            consume:() => element.querySelector('button').click()
          }
        })

      const comparePotionCure = (a:any, b:any) => {
        if (a.cure > b.cure) return -1;
        if (b.cure > a.cure) return 1;
      }
      //@ts-ignore
      potions.sort(comparePotionCure)

      return potions
    }

    const books = () => {
      const inventory = document.querySelector('.list-group')?.querySelectorAll("li")

      //@ts-ignore
      const books = [...inventory]
        .filter(
          item => item
            .querySelector('span')
            ?.textContent.indexOf('Book') > -1
        )
        .map(element => {
          let [name, amount] = element.querySelector('span').textContent.split('x')
          name = name.trim()
          amount = Number(amount)

          return {
            name,
            amount,
            consume:() => element.querySelector('button').click()
          }
        })
      
      const [course] = [...inventory].filter(
        item => item
          .querySelector('span')
          ?.textContent.indexOf('Course of JP') > -1
      )
      .map(element => {
        let [name, amount] = element.querySelector('span').textContent.split('x')
        name = name.trim()
        amount = Number(amount)

        return {
          name,
          amount,
          consume:() => element.querySelector('button').click()
        }
      })

      books.push(course)

      const indexRebirth = books.findIndex(book => book.name.indexOf('Rebirth') > -1)

      books.splice(indexRebirth, 1)

      return books
    }

    const startBot = () => {
      life = 
        document
          .querySelector(data.selectorLife)

      const [current, total] = life
        //@ts-ignore
        ?.textContent?.split('/') || ["0", "0"]

      books().every(book => {
        book.consume()
        return false
      })
          
      potions().every(potion => {
        life = 
        document
          .querySelector(data.selectorLife)

        const [current, total] = life
          //@ts-ignore
          ?.textContent?.split('/') || ["0", "0"]

        const diffLife = Number(total) - Number(current)

        if(diffLife >= potion.cure && potion.amount > 0) {
          potion.consume()
          return false
        }
        
        return true
      })

      if(currentLife === Number(current)){
        timeOff++
      }else{
        timeOff = 0
      }

      currentLife = Number(current)

    }

    async function waitUntil() {
      return await new Promise(resolve => {
        //@ts-ignore
        const interval = setInterval(startBot, 500);
        const final = setInterval(() => {
          if(timeOff > 60000000) {
            timeOff = 0
            clearInterval(interval)
            clearInterval(final)
            //@ts-ignore
            resolve()
          }
        }, 1000)

      });
    }

    await waitUntil()
  
    return {
      life
    }
  }, data)  
  await page.close()

}

( async () => {while(true){
  await bot()
}})()
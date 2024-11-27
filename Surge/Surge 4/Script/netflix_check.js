/**
 *
 * [Panel]
 * nf_check = script-name=nf_check, title="Netflix 解锁检测", content="请刷新", update-interval=1
 *
 * [Script]
 * nf_check = type=generic, script-path=https://gist.githubusercontent.com/Hyseen/b06e911a41036ebc36acf04ddebe7b9a/raw/nf_check.js?version=1633074636264, argument=title=Netflix 解锁检测
 *
 * 支持使用脚本使用 argument 参数自定义配置，如：argument=key1=URLEncode(value1)&key2=URLEncode(value2)，具体参数如下所示，
 * title: 面板标题
 * fullContent: 完整解锁时展示的的文本内容，支持以下四个个区域占位符 #REGION_FLAG#、#REGION_CODE#、#REGION_NAME#、#REGION_NAME_EN#，用来展示地区国旗 emoji 、地区编码、地区中文名称、地区英文名称
 * fullIcon: 完整解锁时展示的图标，内容为任意有效的 SF Symbol Name
 * fullIconColor：完整解锁时展示的图标颜色，内容为颜色的 HEX 编码
 * fullStyle: 完整解锁时展示的图标样式，参数可选值有 good, info, alert, error
 * onlyOriginalContent：仅解锁自制剧时展示的文本内容，支持以下四个个区域占位符 #REGION_FLAG#、#REGION_CODE#、#REGION_NAME#、#REGION_NAME_EN#，用来展示地区国旗 emoji 、地区编码、地区中文名称、地区英文名称
 * onlyOriginalIcon: 仅解锁自制剧时展示的图标
 * onlyOriginalIconColor: 仅解锁自制剧时展示的图标颜色
 * onlyOriginalStyle: 仅解锁自制剧时展示的图标样式
 * notAvailableContent: 不支持解锁时展示的文本内容
 * notAvailableIcon: 不支持解锁时展示的图标
 * notAvailableIconColor: 不支持解锁时展示的图标颜色
 * notAvailableStyle: 不支持解锁时展示的图标样式
 * errorContent: 检测异常时展示的文本内容
 * errorIcon: 检测异常时展示的图标
 * errorIconColor: 检测异常时展示的图标颜色
 * errorStyle: 检测异常时展示的图标样式
 */

const BASE_URL = 'https://www.netflix.com/title/'
const FILM_ID = 81280792
const AREA_TEST_FILM_ID = 80018499
const DEFAULT_OPTIONS = {
  title: 'Netflix', 
  fullContent: '完整支持 | 地区: #REGION_FLAG# #REGION_NAME#', 
  fullIcon: 'checkmark.seal', 
  fullIconColor: '#16A951', 
  fullStyle: 'good', 
  onlyOriginalContent: '仅支持自制剧 | 地区: #REGION_FLAG# #REGION_NAME#', 
  onlyOriginalIcon: '', 
  onlyOriginalIconColor: '', 
  onlyOriginalStyle: 'info', 
  notAvailableContent: '不支持', 
  notAvailableIcon: '', 
  notAvailableIconColor: '', 
  notAvailableStyle: 'alert', 
  errorContent: '检测失败，请重试', 
  errorIcon: '', 
  errorIconColor: '', 
  errorStyle: 'error', 
}

let options = getOptions()
let panel = {
  title: options.title, 
}

;(async () => {
  await Promise.race([test(FILM_ID), timeout(10000)])
    .then(async region => {
      if (options.fullIcon) {
        panel['icon'] = options.fullIcon
        panel['icon-color'] = options.fullIconColor ? options.fullIconColor : undefined
      } else {
        panel['style'] = options.fullStyle
      }
      let content = options.fullContent
      if (content.indexOf('#REGION_FLAG#') !== -1) {
        content.replaceAll('#REGION_FLAG#')
      }

      panel['content'] = replaceRegionPlaceholder(options.fullContent, region)
    })
    .catch(async error => {
      if (error !== 'Not Found') {
        return Promise.reject(error)
      }

      if (options.onlyOriginalIcon) {
        panel['icon'] = options.onlyOriginalIcon
        panel['icon-color'] = options.onlyOriginalIconColor ? options.onlyOriginalIconColor : undefined
      } else {
        panel['style'] = options.onlyOriginalStyle
      }

      if (
        options.onlyOriginalContent.indexOf('#REGION_FLAG#') === -1 &&
        options.onlyOriginalContent.indexOf('#REGION_CODE#') === -1 &&
        options.onlyOriginalContent.indexOf('#REGION_NAME#') === -1 &&
        options.onlyOriginalContent.indexOf('#REGION_NAME_EN#') === -1
      ) {
        panel['content'] = options.onlyOriginalContent
        return
      }

      let region = await Promise.race([test(AREA_TEST_FILM_ID), timeout(10000)])
      panel['content'] = replaceRegionPlaceholder(options.onlyOriginalContent, region)
    })
    .catch(error => {
      if (error !== 'Not Available') {
        return Promise.reject(error)
      }

      panel['content'] = options.notAvailableContent
      if (options.notAvailableIcon) {
        panel['icon'] = options.notAvailableIcon
        panel['icon-color'] = options.notAvailableIconColor ? options.notAvailableIconColor : undefined
      } else {
        panel['style'] = options.notAvailableStyle
      }
    })
})()
  .catch(error => {
    console.log(error)
    if (options.errorIcon) {
      panel['icon'] = options.errorIcon
      panel['icon-color'] = options.errorIconColor ? options.errorIconColor : undefined
    } else {
      panel['style'] = options.errorStyle
    }
    panel['content'] = options.errorContent
  })
  .finally(() => {
    $done(panel)
  })

function test(filmId) {
  return new Promise((resolve, reject) => {
    let option = {
      url: BASE_URL + filmId, 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36', 
      }, 
    }
    $httpClient.get(option, function (error, response, data) {
      if (error != null) {
        reject(error)
        return
      }

      if (response.status === 403) {
        reject('Not Available')
        return
      }

      if (response.status === 404) {
        reject('Not Found')
        return
      }

      if (response.status === 200) {
        let url = response.headers['x-originating-url']
        let region = url.split('/')[3]
        region = region.split('-')[0]
        if (region == 'title') {
          region = 'us'
        }
        resolve(region.toUpperCase())
        return
      }

      reject('Error')
    })
  })
}

function timeout(delay = 5000) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('Timeout')
    }, delay)
  })
}

function getCountryFlagEmoji(countryCode) {
  if (countryCode.toUpperCase() == 'TW') {
    countryCode = 'CN'
  }
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt())
  return String.fromCodePoint(...codePoints)
}

function getOptions() {
  let options = Object.assign({}, DEFAULT_OPTIONS)
  if (typeof $argument != 'undefined') {
    try {
      let params = Object.fromEntries(
        $argument
          .split('&')
          .map(item => item.split('='))
          .map(([k, v]) => [k, decodeURIComponent(v)])
      )
      Object.assign(options, params)
    } catch (error) {
      console.error(`$argument 解析失败，$argument: + ${argument}`)
    }
  }

  return options
}

function replaceRegionPlaceholder(content, region) {
  let result = content

  if (result.indexOf('#REGION_CODE#') !== -1) {
    result = result.replaceAll('#REGION_CODE#', region.toUpperCase())
  }
  if (result.indexOf('#REGION_FLAG#') !== -1) {
    result = result.replaceAll('#REGION_FLAG#', getCountryFlagEmoji(region.toUpperCase()))
  }

  if (result.indexOf('#REGION_NAME#') !== -1) {
    result = result.replaceAll('#REGION_NAME#', REGION_NAMES?.[region.toUpperCase()]?.chinese ?? '')
  }

  if (result.indexOf('#REGION_NAME_EN#') !== -1) {
    result = result.replaceAll('#REGION_NAME_EN#', REGION_NAMES?.[region.toUpperCase()]?.english ?? '')
  }

  return result
}

// prettier-ignore
const REGION_NAMES={AF:{chinese:'阿富汗', english:'Afghanistan'}, AL:{chinese:'阿尔巴尼亚', english:'Albania'}, DZ:{chinese:'阿尔及利亚', english:'Algeria'}, AO:{chinese:'安哥拉', english:'Angola'}, AR:{chinese:'阿根廷', english:'Argentina'}, AM:{chinese:'亚美尼亚', english:'Armenia'}, AU:{chinese:'澳大利亚', english:'Australia'}, AT:{chinese:'奥地利', english:'Austria'}, AZ:{chinese:'阿塞拜疆', english:'Azerbaijan'}, BH:{chinese:'巴林', english:'Bahrain'}, BD:{chinese:'孟加拉国', english:'Bangladesh'}, BY:{chinese:'白俄罗斯', english:'Belarus'}, BE:{chinese:'比利时', english:'Belgium'}, BZ:{chinese:'伯利兹', english:'Belize'}, BJ:{chinese:'贝宁', english:'Benin'}, BT:{chinese:'不丹', english:'Bhutan'}, BO:{chinese:'玻利维亚', english:'Bolivia'}, BA:{chinese:'波斯尼亚和黑塞哥维那', english:'Bosnia and Herzegovina'}, BW:{chinese:'博茨瓦纳', english:'Botswana'}, BR:{chinese:'巴西', english:'Brazil'}, VG:{chinese:'英属维京群岛', english:'British Virgin Islands'}, BN:{chinese:'文莱', english:'Brunei'}, BG:{chinese:'保加利亚', english:'Bulgaria'}, BF:{chinese:'布基纳法索', english:'Burkina-faso'}, BI:{chinese:'布隆迪', english:'Burundi'}, KH:{chinese:'柬埔寨', english:'Cambodia'}, CM:{chinese:'喀麦隆', english:'Cameroon'}, CA:{chinese:'加拿大', english:'Canada'}, CV:{chinese:'佛得角', english:'Cape Verde'}, KY:{chinese:'开曼群岛', english:'Cayman Islands'}, CF:{chinese:'中非共和国', english:'Central African Republic'}, TD:{chinese:'乍得', english:'Chad'}, CL:{chinese:'智利', english:'Chile'}, CN:{chinese:'中国', english:'China'}, CO:{chinese:'哥伦比亚', english:'Colombia'}, KM:{chinese:'科摩罗', english:'Comoros'}, CG:{chinese:'刚果(布)', english:'Congo - Brazzaville'}, CD:{chinese:'刚果(金)', english:'Congo - Kinshasa'}, CR:{chinese:'哥斯达黎加', english:'Costa Rica'}, HR:{chinese:'克罗地亚', english:'Croatia'}, CY:{chinese:'塞浦路斯', english:'Cyprus'}, CZ:{chinese:'捷克共和国', english:'Czech Republic'}, DK:{chinese:'丹麦', english:'Denmark'}, DJ:{chinese:'吉布提', english:'Djibouti'}, DO:{chinese:'多米尼加共和国', english:'Dominican Republic'}, EC:{chinese:'厄瓜多尔', english:'Ecuador'}, EG:{chinese:'埃及', english:'Egypt'}, SV:{chinese:'萨尔瓦多', english:'EI Salvador'}, GQ:{chinese:'赤道几内亚', english:'Equatorial Guinea'}, ER:{chinese:'厄立特里亚', english:'Eritrea'}, EE:{chinese:'爱沙尼亚', english:'Estonia'}, ET:{chinese:'埃塞俄比亚', english:'Ethiopia'}, FJ:{chinese:'斐济', english:'Fiji'}, FI:{chinese:'芬兰', english:'Finland'}, FR:{chinese:'法国', english:'France'}, GA:{chinese:'加蓬', english:'Gabon'}, GM:{chinese:'冈比亚', english:'Gambia'}, GE:{chinese:'格鲁吉亚', english:'Georgia'}, DE:{chinese:'德国', english:'Germany'}, GH:{chinese:'加纳', english:'Ghana'}, GR:{chinese:'希腊', english:'Greece'}, GL:{chinese:'格陵兰', english:'Greenland'}, GT:{chinese:'危地马拉', english:'Guatemala'}, GN:{chinese:'几内亚', english:'Guinea'}, GY:{chinese:'圭亚那', english:'Guyana'}, HT:{chinese:'海地', english:'Haiti'}, HN:{chinese:'洪都拉斯', english:'Honduras'}, HK:{chinese:'中国香港', english:'Hong Kong'}, HU:{chinese:'匈牙利', english:'Hungary'}, IS:{chinese:'冰岛', english:'Iceland'}, IN:{chinese:'印度', english:'India'}, ID:{chinese:'印度尼西亚', english:'Indonesia'}, IR:{chinese:'伊朗', english:'Iran'}, IQ:{chinese:'伊拉克', english:'Iraq'}, IE:{chinese:'爱尔兰', english:'Ireland'}, IM:{chinese:'马恩岛', english:'Isle of Man'}, IL:{chinese:'以色列', english:'Israel'}, IT:{chinese:'意大利', english:'Italy'}, CI:{chinese:'科特迪瓦', english:'Ivory Coast'}, JM:{chinese:'牙买加', english:'Jamaica'}, JP:{chinese:'日本', english:'Japan'}, JO:{chinese:'约旦', english:'Jordan'}, KZ:{chinese:'哈萨克斯坦', english:'Kazakstan'}, KE:{chinese:'肯尼亚', english:'Kenya'}, KR:{chinese:'韩国', english:'Korea'}, KW:{chinese:'科威特', english:'Kuwait'}, KG:{chinese:'吉尔吉斯斯坦', english:'Kyrgyzstan'}, LA:{chinese:'老挝', english:'Laos'}, LV:{chinese:'拉脱维亚', english:'Latvia'}, LB:{chinese:'黎巴嫩', english:'Lebanon'}, LS:{chinese:'莱索托', english:'Lesotho'}, LR:{chinese:'利比里亚', english:'Liberia'}, LY:{chinese:'利比亚', english:'Libya'}, LT:{chinese:'立陶宛', english:'Lithuania'}, LU:{chinese:'卢森堡', english:'Luxembourg'}, MO:{chinese:'中国澳门', english:'Macao'}, MK:{chinese:'马其顿', english:'Macedonia'}, MG:{chinese:'马达加斯加', english:'Madagascar'}, MW:{chinese:'马拉维', english:'Malawi'}, MY:{chinese:'马来西亚', english:'Malaysia'}, MV:{chinese:'马尔代夫', english:'Maldives'}, ML:{chinese:'马里', english:'Mali'}, MT:{chinese:'马耳他', english:'Malta'}, MR:{chinese:'毛利塔尼亚', english:'Mauritania'}, MU:{chinese:'毛里求斯', english:'Mauritius'}, MX:{chinese:'墨西哥', english:'Mexico'}, MD:{chinese:'摩尔多瓦', english:'Moldova'}, MC:{chinese:'摩纳哥', english:'Monaco'}, MN:{chinese:'蒙古', english:'Mongolia'}, ME:{chinese:'黑山共和国', english:'Montenegro'}, MA:{chinese:'摩洛哥', english:'Morocco'}, MZ:{chinese:'莫桑比克', english:'Mozambique'}, MM:{chinese:'缅甸', english:'Myanmar(Burma)'}, NA:{chinese:'纳米比亚', english:'Namibia'}, NP:{chinese:'尼泊尔', english:'Nepal'}, NL:{chinese:'荷兰', english:'Netherlands'}, NZ:{chinese:'新西兰', english:'New Zealand'}, NI:{chinese:'尼加拉瓜', english:'Nicaragua'}, NE:{chinese:'尼日尔', english:'Niger'}, NG:{chinese:'尼日利亚', english:'Nigeria'}, KP:{chinese:'朝鲜', english:'North Korea'}, NO:{chinese:'挪威', english:'Norway'}, OM:{chinese:'阿曼', english:'Oman'}, PK:{chinese:'巴基斯坦', english:'Pakistan'}, PA:{chinese:'巴拿马', english:'Panama'}, PY:{chinese:'巴拉圭', english:'Paraguay'}, PE:{chinese:'秘鲁', english:'Peru'}, PH:{chinese:'菲律宾', english:'Philippines'}, PL:{chinese:'波兰', english:'Poland'}, PT:{chinese:'葡萄牙', english:'Portugal'}, PR:{chinese:'波多黎各', english:'Puerto Rico'}, QA:{chinese:'卡塔尔', english:'Qatar'}, RE:{chinese:'留尼旺', english:'Reunion'}, RO:{chinese:'罗马尼亚', english:'Romania'}, RU:{chinese:'俄罗斯', english:'Russia'}, RW:{chinese:'卢旺达', english:'Rwanda'}, SM:{chinese:'圣马力诺', english:'San Marino'}, SA:{chinese:'沙特阿拉伯', english:'Saudi Arabia'}, SN:{chinese:'塞内加尔', english:'Senegal'}, RS:{chinese:'塞尔维亚', english:'Serbia'}, SL:{chinese:'塞拉利昂', english:'Sierra Leone'}, SG:{chinese:'新加坡', english:'Singapore'}, SK:{chinese:'斯洛伐克', english:'Slovakia'}, SI:{chinese:'斯洛文尼亚', english:'Slovenia'}, SO:{chinese:'索马里', english:'Somalia'}, ZA:{chinese:'南非', english:'South Africa'}, ES:{chinese:'西班牙', english:'Spain'}, LK:{chinese:'斯里兰卡', english:'Sri Lanka'}, SD:{chinese:'苏丹', english:'Sudan'}, SR:{chinese:'苏里南', english:'Suriname'}, SZ:{chinese:'斯威士兰', english:'Swaziland'}, SE:{chinese:'瑞典', english:'Sweden'}, CH:{chinese:'瑞士', english:'Switzerland'}, SY:{chinese:'叙利亚', english:'Syria'}, TW:{chinese:'中国台湾', english:'Taiwan'}, TJ:{chinese:'塔吉克斯坦', english:'Tajikstan'}, TZ:{chinese:'坦桑尼亚', english:'Tanzania'}, TH:{chinese:'泰国', english:'Thailand'}, TG:{chinese:'多哥', english:'Togo'}, TO:{chinese:'汤加', english:'Tonga'}, TT:{chinese:'特立尼达和多巴哥', english:'Trinidad and Tobago'}, TN:{chinese:'突尼斯', english:'Tunisia'}, TR:{chinese:'土耳其', english:'Turkey'}, TM:{chinese:'土库曼斯坦', english:'Turkmenistan'}, VI:{chinese:'美属维尔京群岛', english:'U.S. Virgin Islands'}, UG:{chinese:'乌干达', english:'Uganda'}, UA:{chinese:'乌克兰', english:'Ukraine'}, AE:{chinese:'阿拉伯联合酋长国', english:'United Arab Emirates'}, GB:{chinese:'英国', english:'United Kiongdom'}, US:{chinese:'美国', english:'USA'}, UY:{chinese:'乌拉圭', english:'Uruguay'}, UZ:{chinese:'乌兹别克斯坦', english:'Uzbekistan'}, VA:{chinese:'梵蒂冈城', english:'Vatican City'}, VE:{chinese:'委内瑞拉', english:'Venezuela'}, VN:{chinese:'越南', english:'Vietnam'}, YE:{chinese:'也门', english:'Yemen'}, YU:{chinese:'南斯拉夫', english:'Yugoslavia'}, ZR:{chinese:'扎伊尔', english:'Zaire'}, ZM:{chinese:'赞比亚', english:'Zambia'}, ZW:{chinese:'津巴布韦', english:'Zimbabwe'}}
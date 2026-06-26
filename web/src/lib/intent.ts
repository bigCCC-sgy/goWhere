import type { BudgetLevel } from "@/store/useJourneyStore";
import { budgetValue } from "./preference-options";
import type { SceneCode } from "./types";

export type ParsedIntent = {
  scene?: SceneCode;
  companions?: string;
  budgetLevel?: BudgetLevel;
  budget?: number;
  distancePreference?: string;
  cuisineTags: string[];
  moodTags: string[];
  avoidTags: string[];
};

type CuisineMatcher = {
  label: string;
  words: string[];
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word.toLowerCase()));
}

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean);
}

const cuisineMatchers: CuisineMatcher[] = [
  { label: "南京菜/淮扬菜", words: ["南京菜", "淮扬菜", "淮扬", "盐水鸭"] },
  { label: "川湘菜", words: ["川湘", "川菜", "湘菜", "辣菜"] },
  { label: "江浙菜", words: ["江浙菜", "杭帮菜", "本帮菜", "苏浙菜"] },
  { label: "粤菜", words: ["粤菜", "广东菜", "早茶"] },
  { label: "日料", words: ["日料", "日本料理", "寿司", "刺身"] },
  { label: "韩餐", words: ["韩餐", "韩国料理", "韩式"] },
  { label: "西餐", words: ["西餐", "牛排", "意面", "披萨"] },
  { label: "东南亚菜", words: ["东南亚菜", "泰国菜", "越南菜", "新加坡菜"] },
  { label: "海鲜", words: ["海鲜"] },
  { label: "烤鱼", words: ["烤鱼"] },
  { label: "小龙虾", words: ["小龙虾", "龙虾"] },
  { label: "串串冒菜", words: ["串串", "冒菜"] },
  { label: "麻辣烫", words: ["麻辣烫"] },
  { label: "粉面", words: ["粉面", "面馆", "面条", "米粉", "米线", "拉面"] },
  { label: "素食", words: ["素食", "素菜", "轻素"] },
];

const diningCuisineWords = cuisineMatchers.flatMap((item) => item.words);

export function parseIntentFromText(text: string): ParsedIntent {
  const normalized = text.trim().toLowerCase();
  const result: ParsedIntent = {
    cuisineTags: [],
    moodTags: [],
    avoidTags: [],
  };

  if (includesAny(normalized, ["今晚", "晚上随便", "随便安排", "不知道去哪", "没想法"])) {
    result.scene = "tonight";
  }
  if (includesAny(normalized, ["半天", "半日", "半天路线", "半天安排"])) {
    result.scene = "halfday";
  }
  if (includesAny(normalized, ["下班", "下班后", "下班放松"])) {
    result.scene = "after_work";
  }

  if (includesAny(normalized, ["火锅", "烧烤"])) {
    result.scene = "hotpot_bbq";
  }
  if (includesAny(normalized, ["吃饭", "餐厅", "晚餐", "正餐", "约饭", "下班饭", ...diningCuisineWords])) {
    result.scene = result.scene ?? "eat";
  }
  if (includesAny(normalized, ["咖啡", "甜品"])) {
    result.scene = "coffee";
  }
  if (includesAny(normalized, ["下午茶", "茶饮", "奶茶"])) {
    result.scene = "afternoon_tea";
  }
  if (includesAny(normalized, ["夜宵", "小酒", "小酒馆", "喝酒", "酒馆", "酒吧"])) {
    result.scene = "nightlife";
  }
  if (includesAny(normalized, ["地方小吃", "特色小吃", "小吃"])) {
    result.scene = "local_snack";
  }
  if (includesAny(normalized, ["轻食", "简餐", "沙拉"])) {
    result.scene = "light_meal";
  }
  if (includesAny(normalized, ["约会餐厅", "氛围餐厅", "情侣餐厅"])) {
    result.scene = "date_dining";
  }

  if (includesAny(normalized, ["电影", "影院", "电影院"])) {
    result.scene = "movie";
  }
  if (includesAny(normalized, ["ktv", "唱歌", "量贩式"])) {
    result.scene = "ktv";
  }
  if (includesAny(normalized, ["网吧", "网咖", "电竞", "开黑"])) {
    result.scene = "internet_cafe";
  }
  if (includesAny(normalized, ["台球", "棋牌", "桌游"])) {
    result.scene = "billiards_boardgames";
  }
  if (includesAny(normalized, ["游乐场", "电玩城", "亲子乐园"])) {
    result.scene = "arcade";
  }
  if (includesAny(normalized, ["看展", "美术馆", "博物馆", "展览", "剧院", "演出", "音乐会", "脱口秀"])) {
    result.scene = "culture";
  }
  if (includesAny(normalized, ["购物", "逛街", "买东西", "商场", "购物中心"])) {
    result.scene = "shopping";
  }
  if (includesAny(normalized, ["散步", "漫步", "citywalk", "city walk", "街区"])) {
    result.scene = "walk";
  }

  if (includesAny(normalized, ["按摩", "足疗", "养生"])) {
    result.scene = "massage";
  }
  if (includesAny(normalized, ["洗浴", "汗蒸", "温泉"])) {
    result.scene = "bath_spa";
  }
  if (includesAny(normalized, ["酒店", "住宿", "宾馆", "民宿", "住一晚", "入住", "过夜", "订房", "附近住"])) {
    result.scene = "lodging";
  }
  if (includesAny(normalized, ["安静坐坐", "安静待着", "放空"])) {
    result.scene = "quiet_sit";
  }
  if (includesAny(normalized, ["公园散步", "公园走走"])) {
    result.scene = "park_walk";
  }
  if (includesAny(normalized, ["书店咖啡", "书店", "看书"])) {
    result.scene = "bookstore_coffee";
  }
  if (includesAny(normalized, ["拍照", "出片", "写真", "打卡"])) {
    result.scene = "photo";
  }
  if (includesAny(normalized, ["运动", "健身", "跑步", "瑜伽", "放松"])) {
    result.scene = result.scene ?? "sport";
  }

  if (includesAny(normalized, ["约会", "第一次见", "第一次约", "情侣", "对象"])) {
    result.scene = result.scene ?? "date";
    result.companions = "date";
  }
  if (includesAny(normalized, ["朋友", "聚会"])) {
    result.scene = result.scene ?? "friends";
    result.companions = "friends";
  }
  if (includesAny(normalized, ["周末", "周六", "周日", "逛逛"])) {
    result.scene = result.scene ?? "weekend";
  }
  if (includesAny(normalized, ["一个人", "独处", "自己"])) {
    result.scene = result.scene ?? "alone";
    result.companions = "alone";
  }
  if (includesAny(normalized, ["下雨", "雨天", "室内"])) {
    result.scene = result.scene ?? "rain";
    result.moodTags.push("室内");
  }
  if (includesAny(normalized, ["亲子", "小孩", "孩子", "遛娃"])) {
    result.scene = "family";
    result.companions = "kids";
  }
  if (includesAny(normalized, ["宠物", "带狗", "狗狗", "猫"])) {
    result.scene = "pet";
    result.companions = "pet";
  }
  if (includesAny(normalized, ["学习", "办公", "自习", "写方案", "写作业"])) {
    result.scene = "work";
  }

  if (includesAny(normalized, ["家人", "亲子", "爸妈"])) result.companions = "family";
  if (includesAny(normalized, ["同事", "团建"])) result.companions = "colleagues";

  if (includesAny(normalized, ["免费", "省钱", "便宜", "不要太贵", "不太贵", "少花钱"])) {
    result.budgetLevel = normalized.includes("免费") ? "free" : "under100";
  } else if (includesAny(normalized, ["100以内", "一百以内", "人均100", "人均 100"])) {
    result.budgetLevel = "under100";
  } else if (includesAny(normalized, ["预算300", "预算 300", "舒服一点", "好一点"])) {
    result.budgetLevel = "comfort";
  } else if (includesAny(normalized, ["400", "贵一点", "高级一点"])) {
    result.budgetLevel = "premium";
  } else if (includesAny(normalized, ["不设限", "都可以", "预算不限"])) {
    result.budgetLevel = "open";
  } else if (includesAny(normalized, ["适中", "人均150", "人均 150"])) {
    result.budgetLevel = "balanced";
  }
  if (result.budgetLevel) {
    result.budget = budgetValue(result.budgetLevel);
  }

  if (includesAny(normalized, ["离我近", "近一点", "附近", "就近"])) result.distancePreference = "离我近";
  if (includesAny(normalized, ["步行", "走路可达"])) result.distancePreference = "步行可达";
  if (includesAny(normalized, ["地铁", "交通方便"])) result.distancePreference = "地铁方便";
  if (includesAny(normalized, ["可以打车", "打车"])) result.distancePreference = "打车 20 分钟内";
  if (includesAny(normalized, ["不想走", "少走路", "别太累"])) result.distancePreference = "不想走太多";
  if (includesAny(normalized, ["远一点", "值得"])) result.distancePreference = "只要值得";

  cuisineMatchers.forEach((matcher) => {
    if (includesAny(normalized, matcher.words)) result.cuisineTags.push(matcher.label);
  });
  if (includesAny(normalized, ["不挑", "随便"])) result.cuisineTags.push("不挑");

  if (includesAny(normalized, ["安静", "不吵", "别太吵"])) result.moodTags.push("安静");
  if (includesAny(normalized, ["热闹", "有氛围"])) result.moodTags.push("热闹");
  if (includesAny(normalized, ["出片", "拍照", "好看"])) result.moodTags.push("出片");
  if (includesAny(normalized, ["松弛", "放松", "舒服"])) result.moodTags.push("松弛");
  if (includesAny(normalized, ["新鲜", "没去过"])) result.moodTags.push("新鲜感");
  if (includesAny(normalized, ["不累", "省力", "轻松"])) result.moodTags.push("不累");
  if (includesAny(normalized, ["不赶", "慢一点"])) result.moodTags.push("不赶");
  if (includesAny(normalized, ["户外", "公园", "散步"])) result.moodTags.push("户外");
  if (includesAny(normalized, ["烟火气", "市井"])) result.moodTags.push("有烟火气");
  if (includesAny(normalized, ["精致", "高级"])) result.moodTags.push("精致");
  if (includesAny(normalized, ["小众", "人少"])) result.moodTags.push("小众");
  if (includesAny(normalized, ["治愈", "恢复"])) result.moodTags.push("治愈");
  if (includesAny(normalized, ["聊天", "好聊"])) result.moodTags.push("适合聊天");

  if (includesAny(normalized, ["太吵", "吵"])) result.avoidTags.push("太吵");
  if (includesAny(normalized, ["排队", "等位", "排太久"])) result.avoidTags.push("排队久");
  if (includesAny(normalized, ["太贵", "贵"])) result.avoidTags.push("太贵");
  if (includesAny(normalized, ["太远", "远"])) result.avoidTags.push("太远");
  if (includesAny(normalized, ["商业化"])) result.avoidTags.push("商业化太重");
  if (includesAny(normalized, ["停车"])) result.avoidTags.push("不好停车");
  if (includesAny(normalized, ["人太多", "拥挤"])) result.avoidTags.push("人太多");
  if (includesAny(normalized, ["太晒", "晒"])) result.avoidTags.push("太晒");
  if (includesAny(normalized, ["太累", "累"])) result.avoidTags.push("太累");

  return {
    ...result,
    cuisineTags: unique(result.cuisineTags),
    moodTags: unique(result.moodTags),
    avoidTags: unique(result.avoidTags),
  };
}

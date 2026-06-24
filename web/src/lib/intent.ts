import type { SceneCode } from "./types";
import { budgetValue } from "./preference-options";
import type { BudgetLevel } from "@/store/useJourneyStore";

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

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean);
}

export function parseIntentFromText(text: string): ParsedIntent {
  const normalized = text.trim().toLowerCase();
  const result: ParsedIntent = {
    cuisineTags: [],
    moodTags: [],
    avoidTags: [],
  };

  if (includesAny(normalized, ["火锅", "烧烤", "吃饭", "餐厅", "晚餐", "小吃", "日料", "西餐", "粤菜"])) {
    result.scene = "eat";
  }
  if (includesAny(normalized, ["咖啡", "甜品", "下午茶", "奶茶"])) {
    result.scene = "coffee";
  }
  if (includesAny(normalized, ["约会", "第一次见", "第一次约", "情侣", "对象"])) {
    result.scene = "date";
  }
  if (includesAny(normalized, ["朋友", "聚会", "小酌", "喝酒"])) {
    result.scene = result.scene ?? "friends";
    result.companions = "friends";
  }
  if (includesAny(normalized, ["周末", "半日", "逛逛"])) {
    result.scene = result.scene ?? "weekend";
  }
  if (includesAny(normalized, ["看展", "美术馆", "博物馆", "展览"])) {
    result.scene = "culture";
  }
  if (includesAny(normalized, ["电影", "演出", "剧院", "音乐会", "脱口秀"])) {
    result.scene = "show";
  }
  if (includesAny(normalized, ["散步", "漫步", "citywalk", "city walk", "街区"])) {
    result.scene = "walk";
  }
  if (includesAny(normalized, ["夜生活", "酒吧", "小酌", "夜游"])) {
    result.scene = "nightlife";
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
  if (includesAny(normalized, ["运动", "健身", "跑步", "瑜伽", "放松"])) {
    result.scene = result.scene ?? "sport";
  }
  if (includesAny(normalized, ["购物", "逛街", "买东西", "商场"])) {
    result.scene = "shopping";
  }
  if (includesAny(normalized, ["拍照", "出片", "写真", "打卡"])) {
    result.scene = "photo";
  }
  if (includesAny(normalized, ["酒店", "住宿", "宾馆", "民宿", "住一晚", "入住", "过夜", "订房", "附近住"])) {
    result.scene = "lodging";
  }
  if (includesAny(normalized, ["一个人", "独处", "自己"])) {
    result.scene = "alone";
    result.companions = "alone";
  }
  if (includesAny(normalized, ["下雨", "雨天", "室内"])) {
    result.scene = "rain";
    result.moodTags.push("室内");
  }

  if (includesAny(normalized, ["情侣", "对象", "约会"])) result.companions = "date";
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

  const cuisineWords = ["火锅", "烧烤", "地方菜", "日料", "西餐", "粤菜", "小吃", "咖啡甜品", "轻食", "酒馆"];
  cuisineWords.forEach((word) => {
    if (normalized.includes(word.toLowerCase())) result.cuisineTags.push(word);
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

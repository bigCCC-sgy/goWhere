import type { BudgetLevel } from "@/store/useJourneyStore";
import type { SceneCode } from "./types";

export type PreferenceOption<T extends string = string> = {
  value: T;
  label: string;
  prompt?: string;
};

export const sceneCategories = ["常用", "吃喝", "玩乐", "放松", "帮我规划"] as const;
export type SceneCategory = (typeof sceneCategories)[number];

export type SceneOption = PreferenceOption<SceneCode> & {
  category: SceneCategory;
  home?: boolean;
  query: string;
  moodTags: string[];
  avoidTags: string[];
};

export const sceneOptions: SceneOption[] = [
  {
    value: "eat",
    label: "吃饭",
    prompt: "好好吃一顿",
    category: "常用",
    home: true,
    query: "想找一顿舒服的吃饭安排，预算适中，不想排队太久。",
    moodTags: ["松弛"],
    avoidTags: ["排队久"],
  },
  {
    value: "coffee",
    label: "咖啡甜品",
    prompt: "坐一会儿，聊聊天",
    category: "常用",
    home: true,
    query: "想找咖啡甜品路线，空间舒服，适合聊天或放空。",
    moodTags: ["适合聊天", "松弛"],
    avoidTags: ["太吵"],
  },
  {
    value: "shopping",
    label: "逛商场购物",
    prompt: "买点东西，也吃点",
    category: "常用",
    home: true,
    query: "想逛商场或购物中心，顺便吃点东西，动线别太累。",
    moodTags: ["室内", "精致"],
    avoidTags: ["太远"],
  },
  {
    value: "movie",
    label: "看电影",
    prompt: "看完还能接着走",
    category: "常用",
    home: true,
    query: "想看电影，前后可以顺路吃饭或坐一会儿，交通方便。",
    moodTags: ["有话题", "不赶"],
    avoidTags: ["太远"],
  },
  {
    value: "ktv",
    label: "KTV唱歌",
    prompt: "热闹一点，好收尾",
    category: "常用",
    home: true,
    query: "想找KTV唱歌安排，适合朋友聚会，结束后方便收尾。",
    moodTags: ["热闹", "适合聊天"],
    avoidTags: ["太远"],
  },
  {
    value: "massage",
    label: "按摩足疗",
    prompt: "松一松，恢复状态",
    category: "常用",
    home: true,
    query: "想找按摩足疗或养生放松的地方，环境舒服，别太远。",
    moodTags: ["松弛", "治愈"],
    avoidTags: ["太远"],
  },
  {
    value: "billiards_boardgames",
    label: "台球棋牌",
    prompt: "轻松玩一会儿",
    category: "常用",
    home: true,
    query: "想找台球棋牌或桌游安排，适合朋友一起玩，别太吵。",
    moodTags: ["热闹", "适合聊天"],
    avoidTags: ["太吵"],
  },
  {
    value: "halfday",
    label: "半天安排",
    prompt: "轻计划，不赶路",
    category: "常用",
    home: true,
    query: "想安排半天城市路线，轻松一点，不赶路。",
    moodTags: ["不赶", "松弛"],
    avoidTags: ["太远"],
  },

  {
    value: "eat",
    label: "吃饭",
    prompt: "好好吃一顿",
    category: "吃喝",
    query: "想找一顿舒服的吃饭安排，预算适中，不想排队太久。",
    moodTags: ["松弛"],
    avoidTags: ["排队久"],
  },
  {
    value: "hotpot_bbq",
    label: "火锅烧烤",
    prompt: "热乎，适合聚",
    category: "吃喝",
    query: "想找火锅或烧烤，适合边吃边聊，预算适中。",
    moodTags: ["热闹", "适合聊天"],
    avoidTags: ["排队久"],
  },
  {
    value: "coffee",
    label: "咖啡甜品",
    prompt: "坐一会儿，聊聊天",
    category: "吃喝",
    query: "想找咖啡甜品路线，空间舒服，适合聊天或放空。",
    moodTags: ["适合聊天", "松弛"],
    avoidTags: ["太吵"],
  },
  {
    value: "afternoon_tea",
    label: "下午茶",
    prompt: "轻松坐坐",
    category: "吃喝",
    query: "想找下午茶或茶饮甜品，适合坐一会儿，环境舒服。",
    moodTags: ["精致", "适合聊天"],
    avoidTags: ["太吵"],
  },
  {
    value: "nightlife",
    label: "夜宵小酒",
    prompt: "夜里也好收尾",
    category: "吃喝",
    query: "想找夜宵或小酒馆，可以轻松聊天，安全好收尾。",
    moodTags: ["热闹", "有烟火气"],
    avoidTags: ["太吵"],
  },
  {
    value: "local_snack",
    label: "地方小吃",
    prompt: "烟火气，随便吃",
    category: "吃喝",
    query: "想找地方小吃或特色小吃，有烟火气，别太贵。",
    moodTags: ["有烟火气", "新鲜感"],
    avoidTags: ["太贵"],
  },
  {
    value: "light_meal",
    label: "轻食简餐",
    prompt: "快一点，清爽点",
    category: "吃喝",
    query: "想找轻食简餐，清爽一点，适合快速吃一顿。",
    moodTags: ["不赶", "松弛"],
    avoidTags: ["太贵"],
  },
  {
    value: "date_dining",
    label: "约会餐厅",
    prompt: "氛围好，不尴尬",
    category: "吃喝",
    query: "想找适合约会的餐厅，氛围自然，不尴尬。",
    moodTags: ["精致", "适合聊天"],
    avoidTags: ["太吵"],
  },

  {
    value: "movie",
    label: "看电影",
    prompt: "看完还能接着走",
    category: "玩乐",
    query: "想看电影，前后可以顺路吃饭或坐一会儿，交通方便。",
    moodTags: ["有话题", "不赶"],
    avoidTags: ["太远"],
  },
  {
    value: "ktv",
    label: "KTV唱歌",
    prompt: "热闹一点，好收尾",
    category: "玩乐",
    query: "想找KTV唱歌安排，适合朋友聚会，结束后方便收尾。",
    moodTags: ["热闹", "适合聊天"],
    avoidTags: ["太远"],
  },
  {
    value: "internet_cafe",
    label: "网吧电竞",
    prompt: "开黑，电竞感",
    category: "玩乐",
    query: "想找网吧电竞或电竞馆，适合朋友开黑，设备舒服。",
    moodTags: ["热闹", "有话题"],
    avoidTags: ["太远"],
  },
  {
    value: "billiards_boardgames",
    label: "台球棋牌",
    prompt: "轻松玩一会儿",
    category: "玩乐",
    query: "想找台球棋牌或桌游安排，适合朋友一起玩，别太吵。",
    moodTags: ["热闹", "适合聊天"],
    avoidTags: ["太吵"],
  },
  {
    value: "arcade",
    label: "游乐场",
    prompt: "轻娱乐，不费脑",
    category: "玩乐",
    query: "想找游乐场、电玩城或轻娱乐空间，玩起来轻松一点。",
    moodTags: ["热闹", "新鲜感"],
    avoidTags: ["太远"],
  },
  {
    value: "culture",
    label: "展览演出",
    prompt: "有内容，也好拍",
    category: "玩乐",
    query: "想看展览、美术馆、博物馆或演出，最好有内容、有话题。",
    moodTags: ["出片", "有话题"],
    avoidTags: ["商业化太重"],
  },
  {
    value: "shopping",
    label: "逛商场购物",
    prompt: "买点东西，也吃点",
    category: "玩乐",
    query: "想逛商场或购物中心，顺便吃点东西，动线别太累。",
    moodTags: ["室内", "精致"],
    avoidTags: ["太远"],
  },
  {
    value: "walk",
    label: "城市漫步",
    prompt: "慢慢走一段",
    category: "玩乐",
    query: "想找一条城市漫步路线，有画面感，不赶路。",
    moodTags: ["户外", "不赶", "有烟火气"],
    avoidTags: ["太远"],
  },

  {
    value: "massage",
    label: "按摩足疗",
    prompt: "松一松，恢复状态",
    category: "放松",
    query: "想找按摩足疗或养生放松的地方，环境舒服，别太远。",
    moodTags: ["松弛", "治愈"],
    avoidTags: ["太远"],
  },
  {
    value: "bath_spa",
    label: "洗浴汗蒸",
    prompt: "热乎放松一下",
    category: "放松",
    query: "想找洗浴、汗蒸或温泉，适合放松恢复状态。",
    moodTags: ["松弛", "治愈"],
    avoidTags: ["太远"],
  },
  {
    value: "lodging",
    label: "酒店住宿",
    prompt: "附近住一晚",
    category: "放松",
    query: "晚上想找酒店住宿，推荐附近住一晚的地方。",
    moodTags: ["过夜", "不累"],
    avoidTags: ["太远"],
  },
  {
    value: "quiet_sit",
    label: "安静坐坐",
    prompt: "放空，不被打扰",
    category: "放松",
    query: "想找安静坐坐的地方，可以放空，不要太吵。",
    moodTags: ["安静", "松弛"],
    avoidTags: ["太吵"],
  },
  {
    value: "park_walk",
    label: "公园散步",
    prompt: "走走，透透气",
    category: "放松",
    query: "想找公园散步路线，轻松透气，不要太累。",
    moodTags: ["户外", "治愈"],
    avoidTags: ["太累"],
  },
  {
    value: "bookstore_coffee",
    label: "书店咖啡",
    prompt: "安静看会儿书",
    category: "放松",
    query: "想找书店咖啡，可以安静坐坐，也适合放空。",
    moodTags: ["安静", "适合聊天"],
    avoidTags: ["太吵"],
  },
  {
    value: "photo",
    label: "拍照出片",
    prompt: "有画面感，别太挤",
    category: "放松",
    query: "想找适合拍照出片的路线，有画面感，人别太多。",
    moodTags: ["出片", "适合拍照"],
    avoidTags: ["商业化太重"],
  },
  {
    value: "sport",
    label: "运动放松",
    prompt: "轻运动，恢复状态",
    category: "放松",
    query: "想找运动放松路线，轻松恢复状态，不要太累。",
    moodTags: ["户外", "治愈"],
    avoidTags: ["太远"],
  },

  {
    value: "tonight",
    label: "今晚随便安排",
    prompt: "别费脑，直接走",
    category: "帮我规划",
    query: "今晚想随便安排一下，吃喝玩都可以，路线轻松好收尾。",
    moodTags: ["松弛", "不赶"],
    avoidTags: ["太远"],
  },
  {
    value: "halfday",
    label: "半天城市路线",
    prompt: "半天刚刚好",
    category: "帮我规划",
    query: "想安排半天城市路线，轻松一点，不赶路。",
    moodTags: ["不赶", "松弛"],
    avoidTags: ["太远"],
  },
  {
    value: "date",
    label: "约会不尴尬",
    prompt: "自然一点",
    category: "帮我规划",
    query: "想安排约会路线，自然一点，不尴尬，适合聊天。",
    moodTags: ["适合聊天", "精致"],
    avoidTags: ["太吵"],
  },
  {
    value: "after_work",
    label: "下班放松一下",
    prompt: "恢复一点状态",
    category: "帮我规划",
    query: "下班后想放松一下，可以吃点东西或坐一会儿，不要太累。",
    moodTags: ["松弛", "治愈"],
    avoidTags: ["太累"],
  },
  {
    value: "weekend",
    label: "周末轻松逛逛",
    prompt: "有内容，不折腾",
    category: "帮我规划",
    query: "周末想轻松逛逛，最好有内容、有画面感，不要太累。",
    moodTags: ["出片", "不累"],
    avoidTags: ["太远"],
  },
  {
    value: "friends",
    label: "朋友见面安排",
    prompt: "好聊，方便收尾",
    category: "帮我规划",
    query: "和朋友见面，想要好聊天、轻松一点，别太贵。",
    moodTags: ["热闹", "松弛"],
    avoidTags: ["太贵"],
  },
  {
    value: "rain",
    label: "雨天室内方案",
    prompt: "少走路，也舒服",
    category: "帮我规划",
    query: "下雨天想找室内路线，少走路，预算适中。",
    moodTags: ["室内", "不累"],
    avoidTags: ["太远"],
  },
  {
    value: "alone",
    label: "一个人也舒服",
    prompt: "安静放空一下",
    category: "帮我规划",
    query: "一个人想安静待一会儿，能放空，也不要太费力。",
    moodTags: ["安静", "不累"],
    avoidTags: ["太吵"],
  },
];

export const companionOptions: PreferenceOption[] = [
  { value: "alone", label: "一个人" },
  { value: "friends", label: "朋友" },
  { value: "date", label: "情侣" },
  { value: "family", label: "家人" },
  { value: "colleagues", label: "同事" },
  { value: "kids", label: "带小孩" },
  { value: "pet", label: "带宠物" },
];

export const budgetOptions: Array<PreferenceOption<BudgetLevel> & { amount: number }> = [
  { value: "free", label: "免费/少花钱", amount: 30 },
  { value: "under100", label: "100以内", amount: 100 },
  { value: "balanced", label: "100-200", amount: 150 },
  { value: "comfort", label: "200-400", amount: 300 },
  { value: "premium", label: "400+", amount: 500 },
  { value: "open", label: "不设限", amount: 800 },
];

export const distanceOptions = ["离我近", "步行可达", "地铁方便", "打车 20 分钟内", "不想走太多", "可以远一点", "只要值得"];

export const moodOptions = [
  "安静",
  "热闹",
  "松弛",
  "新鲜感",
  "出片",
  "有话题",
  "不赶",
  "室内",
  "户外",
  "有烟火气",
  "精致",
  "小众",
  "治愈",
  "适合聊天",
  "适合拍照",
  "过夜",
  "不累",
];

export const avoidOptions = ["太吵", "排队久", "太贵", "太远", "商业化太重", "不好停车", "人太多", "太晒", "太累", "不好拍"];

export const cuisineOptions = [
  "不挑",
  "南京菜/淮扬菜",
  "川湘菜",
  "江浙菜",
  "粤菜",
  "日料",
  "韩餐",
  "西餐",
  "东南亚菜",
  "海鲜",
  "烤鱼",
  "小龙虾",
  "串串冒菜",
  "麻辣烫",
  "粉面",
  "素食",
];

export function labelOf(options: PreferenceOption[], value?: string) {
  return options.find((option) => option.value === value)?.label || value || "";
}

export function budgetValue(level: BudgetLevel) {
  return budgetOptions.find((option) => option.value === level)?.amount ?? 150;
}

export function sceneOptionOf(scene: SceneCode) {
  return sceneOptions.find((option) => option.value === scene) ?? sceneOptions[0];
}

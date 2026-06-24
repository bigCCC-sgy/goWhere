import type { SceneCode } from "./types";
import type { BudgetLevel } from "@/store/useJourneyStore";

export type PreferenceOption<T extends string = string> = {
  value: T;
  label: string;
  prompt?: string;
};

export type SceneOption = PreferenceOption<SceneCode> & {
  category: "常用" | "吃喝" | "玩乐" | "放松" | "效率" | "特殊";
  home?: boolean;
  query: string;
  moodTags: string[];
  avoidTags: string[];
};

export const sceneCategories = ["常用", "吃喝", "玩乐", "放松", "效率", "特殊"] as const;

export const sceneOptions: SceneOption[] = [
  {
    value: "eat",
    label: "吃饭",
    prompt: "下班后好好吃一顿",
    category: "常用",
    home: true,
    query: "想找一顿舒服的吃饭安排，预算适中，不想排队太久。",
    moodTags: ["松弛"],
    avoidTags: ["排队久"],
  },
  {
    value: "date",
    label: "约会",
    prompt: "自然一点，不尴尬",
    category: "常用",
    home: true,
    query: "第一次约会，预算300，不想太吵，希望自然一点。",
    moodTags: ["安静", "自然"],
    avoidTags: ["太吵"],
  },
  {
    value: "friends",
    label: "朋友聚会",
    prompt: "好聊，方便收尾",
    category: "常用",
    home: true,
    query: "和朋友见面，想要好聊天、轻松一点，别太贵。",
    moodTags: ["热闹", "松弛"],
    avoidTags: ["太贵"],
  },
  {
    value: "weekend",
    label: "周末",
    prompt: "半日城市漫游",
    category: "常用",
    home: true,
    query: "周末想轻松逛逛，最好有内容、有画面感，不要太累。",
    moodTags: ["出片", "不累"],
    avoidTags: ["太远"],
  },
  {
    value: "alone",
    label: "一个人",
    prompt: "安静放空一下",
    category: "常用",
    home: true,
    query: "一个人想安静待一会儿，能放空，也不要太费力。",
    moodTags: ["安静", "不累"],
    avoidTags: ["太吵"],
  },
  {
    value: "rain",
    label: "雨天",
    prompt: "室内也舒服",
    category: "常用",
    home: true,
    query: "下雨天想找室内路线，少走路，预算适中。",
    moodTags: ["室内", "不累"],
    avoidTags: ["太远"],
  },
  {
    value: "coffee",
    label: "咖啡甜品",
    prompt: "坐一会儿，聊聊天",
    category: "吃喝",
    home: true,
    query: "想找咖啡甜品路线，空间舒服，适合聊天或放空。",
    moodTags: ["适合聊天", "松弛"],
    avoidTags: ["太吵"],
  },
  {
    value: "walk",
    label: "城市漫步",
    prompt: "慢慢走一段",
    category: "玩乐",
    home: true,
    query: "想找一条城市漫步路线，有画面感，不赶路。",
    moodTags: ["户外", "不赶", "有烟火气"],
    avoidTags: ["太远"],
  },
  {
    value: "culture",
    label: "看展",
    prompt: "有内容，也好拍",
    category: "玩乐",
    query: "想看展或逛文化空间，最好有内容、有画面感。",
    moodTags: ["出片", "有话题"],
    avoidTags: ["商业化太重"],
  },
  {
    value: "show",
    label: "电影演出",
    prompt: "看完还能接着走",
    category: "玩乐",
    query: "想安排电影或演出前后路线，交通方便，别太赶。",
    moodTags: ["有话题", "不赶"],
    avoidTags: ["太远"],
  },
  {
    value: "nightlife",
    label: "夜生活",
    prompt: "小酌、夜游、收尾",
    category: "玩乐",
    query: "想找夜生活路线，可以小酌或夜游，安全好收尾。",
    moodTags: ["热闹", "有烟火气"],
    avoidTags: ["太吵"],
  },
  {
    value: "family",
    label: "亲子",
    prompt: "轻松、安全、少折腾",
    category: "特殊",
    query: "想找适合亲子的路线，安全、轻松，别走太多路。",
    moodTags: ["室内", "不累"],
    avoidTags: ["太远", "太吵"],
  },
  {
    value: "pet",
    label: "宠物友好",
    prompt: "带宠也自在",
    category: "特殊",
    query: "想找宠物友好的路线，适合散步或坐一会儿。",
    moodTags: ["户外", "松弛"],
    avoidTags: ["不好停车"],
  },
  {
    value: "work",
    label: "学习办公",
    prompt: "安静、插座、久坐",
    category: "效率",
    query: "想找适合学习办公的地方，安静，可以久坐。",
    moodTags: ["安静", "室内"],
    avoidTags: ["太吵"],
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
    value: "shopping",
    label: "购物逛街",
    prompt: "买点东西，也吃点",
    category: "吃喝",
    query: "想逛街购物，顺便吃点东西，动线别太累。",
    moodTags: ["室内", "精致"],
    avoidTags: ["太远"],
  },
  {
    value: "photo",
    label: "拍照出片",
    prompt: "有画面感，别太挤",
    category: "玩乐",
    query: "想找适合拍照出片的路线，有画面感，人别太多。",
    moodTags: ["出片", "适合拍照"],
    avoidTags: ["商业化太重"],
  },
  {
    value: "halfday",
    label: "短途半日",
    prompt: "轻计划，不赶路",
    category: "放松",
    query: "想安排短途半日路线，轻松一点，不赶路。",
    moodTags: ["不赶", "松弛"],
    avoidTags: ["太远"],
  },
  {
    value: "lodging",
    label: "住宿/住一晚",
    prompt: "演出后休息或附近过夜",
    category: "特殊",
    query: "晚上想找酒店住宿，推荐附近住一晚的地方。",
    moodTags: ["过夜", "不累"],
    avoidTags: ["太远"],
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
];

export const avoidOptions = ["太吵", "排队久", "太贵", "太远", "商业化太重", "不好停车", "人太多", "太晒", "太累", "不好拍"];

export const cuisineOptions = ["火锅", "烧烤", "地方菜", "日料", "西餐", "粤菜", "小吃", "咖啡甜品", "轻食", "酒馆", "不挑"];

export function labelOf(options: PreferenceOption[], value?: string) {
  return options.find((option) => option.value === value)?.label || value || "";
}

export function budgetValue(level: BudgetLevel) {
  return budgetOptions.find((option) => option.value === level)?.amount ?? 150;
}

export function sceneOptionOf(scene: SceneCode) {
  return sceneOptions.find((option) => option.value === scene) ?? sceneOptions[0];
}

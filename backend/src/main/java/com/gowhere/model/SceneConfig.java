package com.gowhere.model;

import java.util.List;

public record SceneConfig(String code, String name, String subtitle, String icon, List<String> poiTypes) {}

package utils

import (
	"encoding/base64"
)

// Base64Decode 解码 Base64 编码的字符串
func Base64Decode(encoded string) (string, error) {
	decoded, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", err
	}
	return string(decoded), nil
}

// Base64Encode 编码字符串为 Base64 格式
func Base64Encode(plain string) string {
	return base64.StdEncoding.EncodeToString([]byte(plain))
}

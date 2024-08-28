package config

import (
	"fmt"
	"github.com/spf13/viper"
	"log"
)

var AppConfig *Config

type Config struct {
	ServerPort string `mapstructure:"ServerPort"`
	ContentDir string `mapstructure:"ContentDir"`
	Log        LogConfig
}

type LogConfig struct {
	Level      string `mapstructure:"LEVEL"`
	RotateDays int    `mapstructure:"ROTATE_DAYS"`
	Format     string `mapstructure:"FORMAT"`
}

func InitConfig(configPath string) {
	fmt.Printf("Using config file: %s\n", configPath)

	viper.SetConfigFile(configPath)

	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("Error reading config file: %v", err)
	}

	if err := viper.Unmarshal(&AppConfig); err != nil {
		log.Fatalf("Unable to decode into struct: %v", err)
	}

	fmt.Println("Config loaded successfully")
}

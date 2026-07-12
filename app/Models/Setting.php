<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'key',
        'value',
    ];

    public static function get($key, $default = null)
    {
        $setting = self::find($key);
        if ($setting) {
            // Try to decode JSON, fallback to raw value
            $decoded = json_decode($setting->value, true);
            return json_last_error() === JSON_ERROR_NONE ? $decoded : $setting->value;
        }
        return $default;
    }

    public static function set($key, $value)
    {
        $valStr = is_array($value) || is_object($value) ? json_encode($value) : $value;
        return self::updateOrCreate(['key' => $key], ['value' => $valStr]);
    }
}

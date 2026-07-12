<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddFieldsToUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $blueprint) {
            if (!Schema::hasColumn('users', 'role')) {
                $blueprint->string('role')->default('customer')->after('email');
            }
            if (!Schema::hasColumn('users', 'sorti_coins_balance')) {
                $blueprint->integer('sorti_coins_balance')->default(0)->after('role');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $blueprint) {
            $blueprint->dropColumn(['role', 'sorti_coins_balance']);
        });
    }
}

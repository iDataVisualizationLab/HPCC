/* MIT License
 *
 * Copyright (c) 2019 Tommy Dang, Ngan V.T. Nguyen
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 *     The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 *     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

//URL: URL: http://10.10.1.4/nagios/cgi-bin/statusjson.cgi?query=service&hostname=compute-1-26&servicedescription=check+temperature

var sampleService =
    JSON.parse(JSON.stringify({
        "format_version": 0,
        "result": {
            "query_time": 1536725817000,
            "cgi": "statusjson.cgi",
            "user": "nagiosadmin",
            "query": "service",
            "query_status": "released",
            "program_start": 1536590856000,
            "last_data_update": 1536725816000,
            "type_code": 0,
            "type_text": "Success",
            "message": ""
        },
        "data": {
            "service": {
                "host_name": "compute-1-26",
                "description": "check temperature",
                "plugin_output": "CPU1 Temp 67 OK CPU2 Temp 49 OK Inlet Temp 10 OK",
                "long_plugin_output": "",
                "perf_data": "",
                "max_attempts": 4,
                "current_attempt": 1,
                "status": 2,
                "last_update": 1536725815000,
                "has_been_checked": true,
                "should_be_scheduled": true,
                "last_check": 1536725788000,
                "check_options": 0,
                "check_type": 0,
                "checks_enabled": true,
                "last_state_change": 1536725788000,
                "last_hard_state_change": 1536591074000,
                "last_hard_state": 2,
                "last_time_ok": 1536725548000,
                "last_time_warning": 0,
                "last_time_unknown": 1534429676000,
                "last_time_critical": 1536725788000,
                "state_type": 0,
                "last_notification": 0,
                "next_notification": 0,
                "next_check": 1536726028000,
                "no_more_notifications": false,
                "notifications_enabled": true,
                "problem_has_been_acknowledged": false,
                "acknowledgement_type": 0,
                "current_notification_number": 4,
                "accept_passive_checks": true,
                "event_handler_enabled": true,
                "flap_detection_enabled": true,
                "is_flapping": false,
                "percent_state_change": 0,
                "latency": 0,
                "execution_time": 5.35,
                "scheduled_downtime_depth": 0,
                "process_performance_data": true,
                "obsess": true
            }
        }
    }))
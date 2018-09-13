/* Sept-2018
 * Tommy Dang (on the HPCC project, as Assistant professor, iDVL@TTU)
 *
 */

var sampleService =
    {   "host_name": "compute-1-26",
        "query_time": 1536725817000,
        "description": "check temperature",
        "temperature": 67,
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
    }
// You will be provided an input file which has a few thousands of these records  
// Questions:
// 1) What computer has max average temperature
// 2) What is the highest temperature? When and Where?
// 3) What is the coldest temperature? When and Where?
// 4) ...
// Similar questions will be asked for other services such as CPU/memory usage. 
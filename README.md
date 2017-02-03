Overview

Virtual-dom dùng cho **fable-elm** (sắp opensource), 99.999% coder ko nên dùng lib này.

Specs:

- speed: diff/patch 10,000 nodes ~1ms
- lazy: block cùng arguments + renderer được reuse
- patch: chỉ những gì thay đổi mới bị thay đổi (lol), riêng text bị replace
- event-handler: chỉ được attach ở #root => có thể có lỗi về event trong 1 số case
- input-value: được lấy từ input.value (lol), riêng checkbox là .checked
- table: không hỗ trợ tốt việc thay đổi vị trí child-nodes (table với 100-1000 rows, re-order ...)

# FAQ

### Không hỗ trợ tốt nghĩa là gì?
Vẫn chạy được nhưng ko tối ưu

### Sao ko dùng lib có sẵn như React
React code **** bỏ ****

### Mình ko nghĩ là React **** ...
**** quan tâm

### Bạn code js như ***
****

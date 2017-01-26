# Overview

Virtual-dom low-level dùng cho **fable-elm** (chuẩn bị opensource), 99.99% coder ko nên dùng lib này.

Đặc điểm:

- speed: diff/patch 10,000 nodes ~1ms
- lazy: block cùng arguments + render được reuse
- patch: chỉ những gì thay đổi mới bị thay đổi (lol), riêng text bị replace thay vì patch
- event-handler: chỉ được attach ở #root => có thể có lỗi về event trong 1 số case nào đó => tạo issue nếu có, cảm ơn.
- table: không hỗ trợ tốt việc thay đổi vị trí child-nodes (table với 500-1000 rows, đổi cách sort ...) => nếu muốn thì gửi pull-request thôi.

# FAQ

### Không hỗ trợ tốt nghĩa là gì?
Vẫn chạy được nhưng ko tối ưu

### Sao ko dùng lib có sẵn như React
Bọn React code **** bỏ ****

### Mình ko nghĩ là React **** ...
Bạn nghĩ gì mình **** quan tâm

### Bạn code js như ***
Mình ko biết code js

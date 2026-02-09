import sys

def send_image_path(image_path):
    """Python客户端发送图片路径到C#程序"""
    try:
        # Windows命名管道客户端
        with open(r'\\.\pipe\ImageDisplayPipe', 'w') as pipe:
            pipe.write(image_path + '\n')
            pipe.flush()
        # print(f"成功发送图片路径: {image_path}")
        return True
    except Exception as e:
        print(f"发送失败: {e}")
        return False
    
def ShowImg(arg: int):
    image_path = r"D:\PersonalData\Projects\GestureRecognition\ThirdParty\dynamic_gestures\comm\icons/"
    if arg == 0: # 握拳 动作开始
        image_path += "Start.png"
    elif arg == 1: # 左
        image_path += "Left.jpg"
    elif arg == 2: # 右
        image_path += "Right.jpg"
    elif arg == 3: # 上
        image_path += "Up.jpg"
    elif arg == 4: # 下
        image_path += "Down.jpg"
    

    send_image_path(image_path)

if __name__ == "__main__":
    # 测试代码
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        send_image_path(image_path)
    else:
        print("请提供图片路径参数")
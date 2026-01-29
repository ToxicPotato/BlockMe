def format_stacks(n):
    """
    Format a block count into Minecraft stacks notation.

    Args:
        n: Number of blocks

    Returns:
        Formatted string (e.g., "3x64 + 12" for 204 blocks)
    """
    stacks = n // 64
    rest = n % 64
    if stacks == 0:
        return f"{rest}"
    if rest == 0:
        return f"{stacks}x64"
    return f"{stacks}x64 + {rest}"
